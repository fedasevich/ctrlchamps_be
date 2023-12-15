import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { Appointment } from 'src/common/entities/appointment.entity';
import { VirtualAssessment } from 'src/common/entities/virtual-assessment.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { VirtualAssessmentStatus } from 'src/common/enums/virtual-assessment.enum';
import { EmailService } from 'src/modules/email/services/email.service';
import { Repository } from 'typeorm';

import { UpdateVirtualAssessmentStatusDto } from './dto/update-status.dto';
import { CreateVirtualAssessmentDto } from './dto/virtual-assessment.dto';

@Injectable()
export class VirtualAssessmentService {
  private readonly requestedVirtualAssessmentTemplateId =
    this.configService.get<string>(
      'SENDGRID_REQUESTED_VIRTUAL_ASSESSMENT_TEMPLATE_ID',
    );

  private readonly caregiverAppointmentRedirectLink =
    this.configService.get<string>('CAREGIVER_APPOINTMENT_REDIRECT_LINK');

  private readonly seekerVirtualAssessmentDoneTemplateId =
    this.configService.get<string>(
      'SENDGRID_SEEKER_SUBMIT_CONTRACT_PROPOSAL_TEMPLATE_ID',
    );

  private readonly caregiverVirtualAssessmentDoneTemplateId =
    this.configService.get<string>(
      'SENDGRID_CAREGIVER_SUBMIT_CONTRACT_PROPOSAL_TEMPLATE_ID',
    );

  private readonly caregiverAcceptedVirtualAssessmentTemplateId =
    this.configService.get<string>(
      'SENDGRID_ACCEPTED_VIRTUAL_ASSESSMENT_TEMPLATE_ID',
    );

  constructor(
    @InjectRepository(VirtualAssessment)
    private readonly virtualAssessmentRepository: Repository<VirtualAssessment>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async createVirtualAssessment(
    createVirtualAssessmentDto: CreateVirtualAssessmentDto,
  ): Promise<void> {
    try {
      const { startTime, endTime, assessmentDate, meetingLink, appointmentId } =
        createVirtualAssessmentDto;

      const appointment = await this.getDetailedAppointmentInfo(appointmentId);

      const virtualAssessment = this.virtualAssessmentRepository.create({
        appointment,
        startTime,
        endTime,
        assessmentDate,
        meetingLink,
      });

      await this.emailService.sendEmail({
        to: appointment.caregiverInfo.user.email,
        templateId: this.requestedVirtualAssessmentTemplateId,
        dynamicTemplateData: {
          clientName: `${appointment.user.firstName} ${appointment.user.lastName}`,
          scheduleLink: this.caregiverAppointmentRedirectLink,
        },
      });

      await this.virtualAssessmentRepository.save(virtualAssessment);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          ErrorMessage.InternalServerError,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async findVirtualAssessmentById(
    appointmentId: string,
  ): Promise<VirtualAssessment> {
    try {
      const virtualAssessment = await this.virtualAssessmentRepository
        .createQueryBuilder('virtualAssessment')
        .leftJoinAndSelect('virtualAssessment.appointment', 'appointment')
        .where('appointment.id = :id', { id: appointmentId })
        .getOne();

      if (!virtualAssessment) {
        throw new HttpException(
          ErrorMessage.VirtualAssessmentNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      return virtualAssessment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          ErrorMessage.InternalServerError,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async deleteVirtualAssessment(appointmentId: string): Promise<void> {
    try {
      const virtualAssessment =
        await this.findVirtualAssessmentById(appointmentId);

      await this.virtualAssessmentRepository.remove(virtualAssessment);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          ErrorMessage.InternalServerError,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async updateStatus(
    appointmentId: string,
    updateStatusDto: UpdateVirtualAssessmentStatusDto,
  ): Promise<void> {
    try {
      const virtualAssessment =
        await this.findVirtualAssessmentById(appointmentId);

      if (!virtualAssessment) {
        throw new HttpException(
          ErrorMessage.VirtualAssessmentNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      virtualAssessment.status = updateStatusDto.status;

      await this.virtualAssessmentRepository.save(virtualAssessment);

      if (updateStatusDto.status === VirtualAssessmentStatus.Finished) {
        await this.sendSubmitContractProposalEmails(appointmentId);
      }

      if (updateStatusDto.status === VirtualAssessmentStatus.Accepted) {
        await this.sendCaregiverAcceptedAppointmentEmail(appointmentId);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          ErrorMessage.InternalServerError,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  private async getDetailedAppointmentInfo(
    appointmentId: string,
  ): Promise<Appointment> {
    try {
      const appointment = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .innerJoinAndSelect('appointment.user', 'user')
        .innerJoinAndSelect('appointment.caregiverInfo', 'caregiverInfo')
        .innerJoinAndSelect('caregiverInfo.user', 'caregiverUser')
        .where('appointment.id = :id', { id: appointmentId })
        .getOne();

      if (!appointment) {
        throw new HttpException(
          ErrorMessage.AppointmentNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      return appointment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          ErrorMessage.InternalServerError,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  private async sendSubmitContractProposalEmails(
    appointmentId: string,
  ): Promise<void> {
    try {
      const appointment = await this.getDetailedAppointmentInfo(appointmentId);

      await this.emailService.sendEmail({
        to: appointment.caregiverInfo.user.email,
        templateId: this.caregiverVirtualAssessmentDoneTemplateId,
      });

      await this.emailService.sendEmail({
        to: appointment.user.email,
        templateId: this.seekerVirtualAssessmentDoneTemplateId,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          ErrorMessage.InternalServerError,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  private async sendCaregiverAcceptedAppointmentEmail(
    appointmentId: string,
  ): Promise<void> {
    try {
      const appointment = await this.getDetailedAppointmentInfo(appointmentId);

      await this.emailService.sendEmail({
        to: appointment.user.email,
        templateId: this.caregiverAcceptedVirtualAssessmentTemplateId,
      });
    } catch (err) {
      throw new HttpException(
        ErrorMessage.InternalServerError,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
