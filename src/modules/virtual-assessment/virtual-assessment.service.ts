import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { format } from 'date-fns';
import { Response } from 'express';
import { Appointment } from 'src/common/entities/appointment.entity';
import { VirtualAssessment } from 'src/common/entities/virtual-assessment.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { NotificationMessage } from 'src/common/enums/notification-message.enum';
import { VirtualAssessmentStatus } from 'src/common/enums/virtual-assessment.enum';
import { AppointmentStatus } from 'src/modules/appointment/enums/appointment-status.enum';
import { EmailService } from 'src/modules/email/services/email.service';
import { Repository } from 'typeorm';

import { NotificationService } from '../notification/notification.service';

import {
  VIRTUAL_ASSESSMENT_DATE_FORMAT,
  VIRTUAL_ASSESSMENT_TIME_FORMAT,
} from './constants/virtual-assessment.constant';
import { RescheduleVirtualAssessmentDto } from './dto/reschedule-assessment.dto';
import { UpdateVirtualAssessmentStatusDto } from './dto/update-status.dto';
import { CreateVirtualAssessmentDto } from './dto/virtual-assessment.dto';

@Injectable()
export class VirtualAssessmentService {
  private readonly requestedVirtualAssessmentTemplateId =
    this.configService.get<string>(
      'SENDGRID_REQUESTED_VIRTUAL_ASSESSMENT_TEMPLATE_ID',
    );

  private readonly requestedVirtualAssessmentReschedulingTemplateId =
    this.configService.get<string>(
      'SENDGRID_REQUESTED_VIRTUAL_ASSESSMENT_RESCHEDULING_TEMPLATE_ID',
    );

  private readonly caregiverAppointmentRedirectLink =
    this.configService.get<string>('CAREGIVER_APPOINTMENT_REDIRECT_LINK');

  private readonly seekerUpdateVirtualAssessmentStatusLink =
    this.configService.get<string>(
      'SEEKER_UPDATE_VIRTUAL_ASSESSMENT_STATUS_LINK',
    );

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
    private readonly notificationService: NotificationService,
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
        .innerJoinAndSelect('appointment.user', 'user')
        .innerJoinAndSelect('appointment.caregiverInfo', 'caregiverInfo')
        .innerJoinAndSelect('caregiverInfo.user', 'userCaregiverInfo')
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
        await this.notificationService.createNotification(
          virtualAssessment.appointment.userId,
          virtualAssessment.appointment.id,
          NotificationMessage.SignOff,
        );
        await this.notificationService.createNotification(
          virtualAssessment.appointment.caregiverInfo.user.id,
          virtualAssessment.appointment.id,
          NotificationMessage.SignOff,
        );
      }

      if (updateStatusDto.status === VirtualAssessmentStatus.Accepted) {
        await this.sendCaregiverAcceptedAppointmentEmail(appointmentId);
        await this.notificationService.createNotification(
          virtualAssessment.appointment.userId,
          virtualAssessment.appointment.id,
          NotificationMessage.AcceptedVA,
        );
        await this.notificationService.createNotification(
          virtualAssessment.appointment.caregiverInfo.user.id,
          virtualAssessment.appointment.id,
          NotificationMessage.AcceptedVA,
        );
      }
      if (updateStatusDto.status === VirtualAssessmentStatus.Rejected) {
        await this.notificationService.createNotification(
          virtualAssessment.appointment.userId,
          virtualAssessment.appointment.id,
          NotificationMessage.RejectedVA,
        );
        await this.notificationService.createNotification(
          virtualAssessment.appointment.caregiverInfo.user.id,
          virtualAssessment.appointment.id,
          NotificationMessage.RejectedVA,
        );
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

  async rescheduleVirtualAssessment(
    appointmentId: string,
    rescheduleAssessmentDto: RescheduleVirtualAssessmentDto,
  ): Promise<void> {
    try {
      const virtualAssessment =
        await this.findVirtualAssessmentById(appointmentId);

      if (virtualAssessment.wasRescheduled) {
        throw new HttpException(
          ErrorMessage.AssessmentAlreadyRescheduled,
          HttpStatus.BAD_REQUEST,
        );
      }

      const { reason, ...rescheduleAssessmentProperties } =
        rescheduleAssessmentDto;

      await this.virtualAssessmentRepository
        .createQueryBuilder('virtualAssessment')
        .update(VirtualAssessment)
        .set({
          ...rescheduleAssessmentProperties,
          wasRescheduled: true,
        })
        .where('appointmentId = :appointmentId', { appointmentId })
        .execute();

      await this.notificationService.createNotification(
        virtualAssessment.appointment.userId,
        virtualAssessment.appointment.id,
        NotificationMessage.RescheduleVA,
      );

      await this.emailService.sendEmail({
        to: virtualAssessment.appointment.user.email,
        templateId: this.requestedVirtualAssessmentReschedulingTemplateId,
        dynamicTemplateData: {
          reason,
          startTime: rescheduleAssessmentDto.startTime,
          endTime: rescheduleAssessmentDto.endTime,
          date: rescheduleAssessmentDto.assessmentDate,
          acceptedLink: `${this.seekerUpdateVirtualAssessmentStatusLink}${appointmentId}?status=${VirtualAssessmentStatus.Accepted}`,
          rejectedLink: `${this.seekerUpdateVirtualAssessmentStatusLink}${appointmentId}?status=${VirtualAssessmentStatus.Rejected}`,
        },
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

  async updateReschedulingStatus(
    appointmentId: string,
    status: VirtualAssessmentStatus,
    res: Response,
  ): Promise<void> {
    try {
      res.redirect(this.configService.get<string>('CORS_ORIGIN'));

      const virtualAssessment =
        await this.findVirtualAssessmentById(appointmentId);

      if (!status) {
        throw new HttpException(
          ErrorMessage.StatusNotProvided,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (status === VirtualAssessmentStatus.Accepted) {
        virtualAssessment.reschedulingAccepted = true;
        virtualAssessment.status = VirtualAssessmentStatus.Accepted;
      }

      if (status === VirtualAssessmentStatus.Rejected) {
        virtualAssessment.reschedulingAccepted = false;
        virtualAssessment.appointment.status = AppointmentStatus.Rejected;
        await this.appointmentRepository.save(virtualAssessment.appointment);
      }

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

  async getTodaysVirtualAssessmentsByTime(): Promise<VirtualAssessment[]> {
    try {
      const currentDate = format(new Date(), VIRTUAL_ASSESSMENT_DATE_FORMAT);
      const currentTime = format(new Date(), VIRTUAL_ASSESSMENT_TIME_FORMAT);

      const virtualAssessments = await this.virtualAssessmentRepository
        .createQueryBuilder('virtualAssessment')
        .leftJoinAndSelect('virtualAssessment.appointment', 'appointment')
        .andWhere('virtualAssessment.assessmentDate = :assessmentDate', {
          assessmentDate: currentDate,
        })
        .andWhere('virtualAssessment.endTime <= :currentTime', {
          currentTime,
        })
        .andWhere('virtualAssessment.status = :status', {
          status: VirtualAssessmentStatus.Accepted,
        })
        .getMany();

      return virtualAssessments;
    } catch (error) {
      throw new HttpException(
        ErrorMessage.InternalServerError,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
