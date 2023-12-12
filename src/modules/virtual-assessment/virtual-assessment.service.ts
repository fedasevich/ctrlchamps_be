import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { Appointment } from 'src/common/entities/appointment.entity';
import { VirtualAssessment } from 'src/common/entities/virtual-assessment.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { EmailService } from 'src/modules/email/services/email.service';
import { Repository } from 'typeorm';

import { CreateVirtualAssessmentDto } from './dto/virtual-assessment.dto';

@Injectable()
export class VirtualAssessmentService {
  private readonly requestedVirtualAssessmentTemplateId =
    this.configService.get<string>(
      'SENDGRID_REQUESTED_VIRTUAL_ASSESSMENT_TEMPLATE_ID',
    );

  private readonly caregiverAppointmentRedirectLink =
    this.configService.get<string>('CAREGIVER_APPOINTMENT_REDIRECT_LINK');

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

      const appointment = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.user', 'user')
        .leftJoinAndSelect('appointment.caregiverInfo', 'caregiverInfo')
        .leftJoinAndSelect('caregiverInfo.user', 'caregiverUser')
        .where('appointment.id = :id', { id: appointmentId })
        .getOne();

      if (!appointment) {
        throw new HttpException(
          ErrorMessage.AppointmentNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

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
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  async deleteVirtualAssessment(appointmentId: string): Promise<void> {
    try {
      const virtualAssessment =
        await this.findVirtualAssessmentById(appointmentId);

      await this.virtualAssessmentRepository.remove(virtualAssessment);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}
