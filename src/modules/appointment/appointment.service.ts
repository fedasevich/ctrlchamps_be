import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { Appointment } from 'src/common/entities/appointment.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { MINIMUM_BALANCE } from 'src/modules/appointment/constants';
import { CreateAppointmentDto } from 'src/modules/appointment/dto/create-appointment.dto';
import { Appointment as AppointmentType } from 'src/modules/appointment/types/appointment.type';
import { CaregiverInfoService } from 'src/modules/caregiver-info/caregiver-info.service';
import { EmailService } from 'src/modules/email/services/email.service';
import { SeekerActivityService } from 'src/modules/seeker-activity/seeker-activity.service';
import { SeekerCapabilityService } from 'src/modules/seeker-capability/seeker-capability.service';
import { SeekerDiagnosisService } from 'src/modules/seeker-diagnosis/seeker-diagnosis.service';
import { SeekerTaskService } from 'src/modules/seeker-task/seeker-task.service';
import { UserService } from 'src/modules/users/user.service';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class AppointmentService {
  private readonly seekerAppointmentTemplateId = this.configService.get<string>(
    'SENDGRID_SEEKER_APPOINTMENT_TEMPLATE_ID',
  );

  private readonly caregiverAppointmentTemplateId =
    this.configService.get<string>(
      'SENDGRID_CAREGIVER_APPOINTMENT_TEMPLATE_ID',
    );

  private readonly seekerAppointmentRedirectLink =
    this.configService.get<string>('SEEKER_APPOINTMENT_REDIRECT_LINK');

  private readonly caregiverAppointmentRedirectLink =
    this.configService.get<string>('CAREGIVER_APPOINTMENT_REDIRECT_LINK');

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly seekerActivityService: SeekerActivityService,
    private readonly seekerTaskService: SeekerTaskService,
    private readonly seekerCapabilityService: SeekerCapabilityService,
    private readonly seekerDiagnosisService: SeekerDiagnosisService,
    private readonly userService: UserService,
    private readonly caregiverInfoService: CaregiverInfoService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async create(
    createAppointment: CreateAppointmentDto,
    userId: string,
  ): Promise<void> {
    try {
      await this.appointmentRepository.manager.transaction(
        async (transactionalEntityManager) => {
          const {
            seekerTasks,
            seekerActivities,
            seekerCapabilities,
            seekerDiagnoses,
            ...appointment
          } = createAppointment;

          const payment = await this.payForHourOfWork(
            userId,
            createAppointment.caregiverInfoId,
            transactionalEntityManager,
          );

          const appointmentId = await this.registerNewAppointment(
            transactionalEntityManager,
            { ...appointment, payment },
            userId,
          );

          if (seekerTasks) {
            await Promise.all(
              seekerTasks.map((taskName) =>
                this.seekerTaskService.createWithTransaction(
                  transactionalEntityManager,
                  appointmentId,
                  taskName,
                ),
              ),
            );
          }

          await Promise.all(
            seekerActivities.map((activity) =>
              this.seekerActivityService.createWithTransaction(
                transactionalEntityManager,
                appointmentId,
                activity.id,
                activity.answer,
              ),
            ),
          );

          await Promise.all(
            seekerCapabilities.map((capabilityId) =>
              this.seekerCapabilityService.createWithTransaction(
                transactionalEntityManager,
                appointmentId,
                capabilityId,
              ),
            ),
          );

          await Promise.all(
            seekerDiagnoses.map((diagnosisId) =>
              this.seekerDiagnosisService.createWithTransaction(
                transactionalEntityManager,
                appointmentId,
                diagnosisId,
              ),
            ),
          );
        },
      );

      await this.sendAppointmentConfirmationEmails(
        userId,
        createAppointment.caregiverInfoId,
      );
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw error;
      }

      throw new HttpException(
        ErrorMessage.FailedCreateAppointment,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async registerNewAppointment(
    transactionalEntityManager: EntityManager,
    appointment: AppointmentType,
    userId: string,
  ): Promise<string> {
    try {
      const { weekdays, ...rest } = appointment;

      const createdAppointment = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(Appointment)
        .values({ ...rest, weekday: JSON.stringify(weekdays), userId })
        .execute();

      return createdAppointment.generatedMaps[0].id as string;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async payForHourOfWork(
    userId: string,
    caregiverInfoId: string,
    transactionalEntityManager: EntityManager,
  ): Promise<number> {
    try {
      const { balance, email } = await this.userService.findById(userId);

      const caregiverInfo =
        await this.caregiverInfoService.findById(caregiverInfoId);

      if (!caregiverInfo) {
        throw new HttpException(
          ErrorMessage.CaregiverInfoNotFound,
          HttpStatus.BAD_REQUEST,
        );
      }

      const updatedSeekerBalance = balance - caregiverInfo.hourlyRate;

      if (updatedSeekerBalance < MINIMUM_BALANCE) {
        throw new HttpException(
          ErrorMessage.NotEnoughMoney,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.userService.updateWithTransaction(
        email,
        { balance: updatedSeekerBalance },
        transactionalEntityManager,
      );

      return caregiverInfo.hourlyRate;
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAppointmentsCountById(caregiverInfoId: string): Promise<number> {
    try {
      const appointments = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .innerJoin('appointment.caregiverInfo', 'caregiverInfo')
        .innerJoin('caregiverInfo.user', 'user')
        .where('caregiverInfo.id = :caregiverInfoId', { caregiverInfoId })
        .getCount();

      return appointments;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }

  private async sendAppointmentConfirmationEmails(
    userId: string,
    caregiverInfoId: string,
  ): Promise<void> {
    try {
      const { email, firstName } = await this.userService.findById(userId);
      const caregiverInfo =
        await this.caregiverInfoService.findUserByCaregiverInfoId(
          caregiverInfoId,
        );

      if (!caregiverInfo) {
        throw new HttpException(
          ErrorMessage.CaregiverNotExist,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.emailService.sendEmail({
        to: email,
        templateId: this.seekerAppointmentTemplateId,
        dynamicTemplateData: {
          name: firstName,
          link: this.seekerAppointmentRedirectLink,
        },
      });

      await this.emailService.sendEmail({
        to: caregiverInfo.user.email,
        templateId: this.caregiverAppointmentTemplateId,
        dynamicTemplateData: {
          link: this.caregiverAppointmentRedirectLink,
        },
      });
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw error;
      }

      throw new HttpException(
        ErrorMessage.FailedSendAppointmentConfirmation,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
