import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { Appointment } from 'src/common/entities/appointment.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { NotificationMessage } from 'src/common/enums/notification-message.enum';
import { CreateAppointmentDto } from 'src/modules/appointment/dto/create-appointment.dto';
import {
  AppointmentListResponse,
  AppointmentQuery,
  Appointment as AppointmentType,
} from 'src/modules/appointment/types/appointment.type';
import { CaregiverInfoService } from 'src/modules/caregiver-info/caregiver-info.service';
import { EmailService } from 'src/modules/email/services/email.service';
import { SeekerActivityService } from 'src/modules/seeker-activity/seeker-activity.service';
import { SeekerCapabilityService } from 'src/modules/seeker-capability/seeker-capability.service';
import { SeekerDiagnosisService } from 'src/modules/seeker-diagnosis/seeker-diagnosis.service';
import { SeekerTaskService } from 'src/modules/seeker-task/seeker-task.service';
import { UserService } from 'src/modules/users/user.service';
import { EntityManager, Repository } from 'typeorm';

import { NotificationService } from '../notification/notification.service';
import { PaymentService } from '../payment/payment.service';
import { UserRole } from '../users/enums/user-role.enum';

import { AppointmentStatus } from './enums/appointment-status.enum';
import { AppointmentType as TypeOfAppointment } from './enums/appointment-type.enum';
import { SortOrder } from './enums/sort-query.enum';

@Injectable()
export class AppointmentService {
  private readonly seekerAppointmentTemplateId = this.configService.get<string>(
    'SENDGRID_SEEKER_APPOINTMENT_TEMPLATE_ID',
  );

  private readonly caregiverAppointmentTemplateId =
    this.configService.get<string>(
      'SENDGRID_CAREGIVER_APPOINTMENT_TEMPLATE_ID',
    );

  private readonly caregiverAppointmentRequestAcceptTemplateId =
    this.configService.get<string>(
      'SENDGRID_APPOINTMENT_REQUEST_ACCEPT_TEMPLATE_ID',
    );

  private readonly caregiverAppointmentRequestRejectTemplateId =
    this.configService.get<string>(
      'SENDGRID_APPOINTMENT_REQUEST_REJECT_TEMPLATE_ID',
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
    @Inject(forwardRef(() => CaregiverInfoService))
    private caregiverInfoService: CaregiverInfoService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => PaymentService))
    private paymentService: PaymentService,
  ) {}

  async findAll(
    query: AppointmentQuery = {},
  ): Promise<AppointmentListResponse> {
    try {
      const limit = query.limit || 0;
      const offset = query.offset || 0;
      const name = query.name || '';
      const sort = query.sort || SortOrder.DESC;

      const [result, total] = await this.appointmentRepository
        .createQueryBuilder('appointment')

        .leftJoin('appointment.user', 'user')
        .addSelect(['user.firstName', 'user.lastName'])

        .leftJoin('appointment.caregiverInfo', 'caregiverInfo')
        .addSelect('caregiverInfo.id')

        .leftJoin('caregiverInfo.user', 'caregiver')
        .addSelect(['caregiver.firstName', 'caregiver.lastName'])

        .where(`(appointment.name LIKE :name )`, {
          name: `%${name}%`,
        })
        .orderBy('appointment.createdAt', sort)
        .take(limit)
        .skip(offset)
        .getManyAndCount();

      return {
        appointments: result,
        count: total,
      };
    } catch (error) {
      throw new HttpException(
        ErrorMessage.InternalServerError,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

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

          const payment = await this.paymentService.payForHourOfWork(
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

          const caregiverInfo =
            await this.caregiverInfoService.findUserByCaregiverInfoId(
              createAppointment.caregiverInfoId,
            );

          await this.paymentService.createSeekerCaregiverTransactions(
            userId,
            caregiverInfo.user.id,
            caregiverInfo.hourlyRate,
            transactionalEntityManager,
            appointmentId,
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

  async findOneById(appointmentId: string): Promise<Appointment> {
    try {
      const appointment = await this.appointmentRepository
        .createQueryBuilder('appointment')

        .innerJoin('appointment.caregiverInfo', 'caregiverInfo')
        .addSelect([
          'caregiverInfo.id',
          'caregiverInfo.timeZone',
          'caregiverInfo.hourlyRate',
        ])
        .innerJoin('caregiverInfo.user', 'caregiver')
        .addSelect([
          'caregiver.id',
          'caregiver.lastName',
          'caregiver.firstName',
        ])

        .innerJoin('appointment.user', 'user')
        .addSelect(['user.id', 'user.lastName', 'user.firstName'])

        .leftJoinAndSelect('appointment.seekerActivities', 'seekerActivity')
        .leftJoinAndSelect('seekerActivity.activity', 'activity')

        .leftJoinAndSelect('appointment.seekerCapabilities', 'seekerCapability')
        .leftJoinAndSelect('seekerCapability.capability', 'capability')

        .leftJoinAndSelect('appointment.seekerDiagnoses', 'seekerDiagnosis')
        .leftJoinAndSelect('seekerDiagnosis.diagnosis', 'diagnosis')

        .innerJoinAndSelect('appointment.seekerTasks', 'seekerTasks')

        .leftJoinAndSelect('appointment.virtualAssessment', 'virtualAssessment')

        .leftJoinAndSelect('appointment.activityLog', 'activityLog')

        .where('appointment.id = :appointmentId', { appointmentId })

        .getOne();

      if (!appointment) {
        throw new HttpException(
          ErrorMessage.AppointmentNotFound,
          HttpStatus.BAD_REQUEST,
        );
      }

      return appointment;
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw error;
      }

      throw new HttpException(
        ErrorMessage.InternalServerError,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAllByUserId(userId: string): Promise<Appointment[]> {
    try {
      return await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.userId = :userId', { userId })
        .getMany();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.InternalServerError,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAllByDate(userId: string, date: string): Promise<Appointment[]> {
    try {
      const user = await this.userService.findById(userId);

      if (!user) {
        throw new HttpException(
          ErrorMessage.UserNotExist,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (user.role !== UserRole.Caregiver) {
        throw new HttpException(
          ErrorMessage.UserIsNotCaregiver,
          HttpStatus.FORBIDDEN,
        );
      }

      const appointments = await this.appointmentRepository
        .createQueryBuilder('appointment')

        .innerJoin('appointment.caregiverInfo', 'caregiverInfo')
        .addSelect(['caregiverInfo.id', 'caregiverInfo.timeZone'])

        .innerJoin('appointment.user', 'user')
        .addSelect(['user.id', 'user.lastName', 'user.firstName'])

        .where('caregiverInfo.userId = :userId', { userId })

        .andWhere('DATE(appointment.startDate) <= :date', {
          date,
        })
        .andWhere('DATE(appointment.endDate) >= :date', {
          date,
        })
        .getMany();

      return appointments;
    } catch (error) {
      throw new HttpException(
        ErrorMessage.InternalServerError,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkAppointmentToBePaid(): Promise<Appointment[]> {
    const appointments = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.status = :completed', {
        completed: AppointmentStatus.Completed,
      })
      .orWhere(
        '(appointment.status = :active AND appointment.type = :recurring)',
        {
          active: AppointmentStatus.Active,
          recurring: TypeOfAppointment.Recurring,
        },
      )
      .andWhere('appointment.startDate <= :now', { now: new Date() })
      .getMany();

    return appointments;
  }

  async updateById(
    appointmentId: string,
    appointment: Partial<Appointment>,
    role?: UserRole,
  ): Promise<void> {
    try {
      const appointmentToUpdate = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .innerJoin('appointment.user', 'user')
        .addSelect(['user.id', 'user.email'])

        .where('appointment.id = :appointmentId', { appointmentId })

        .getOne();

      if (!appointmentToUpdate) {
        throw new HttpException(
          ErrorMessage.AppointmentNotFound,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.appointmentRepository
        .createQueryBuilder()
        .update(Appointment)
        .set(appointment)
        .where('appointment.id = :appointmentId', {
          appointmentId,
        })
        .execute();

      const singleAppointment = await this.findOneById(appointmentId);

      const { status: appointmentStatus } = appointment;

      const {
        status: appointmentToUpdateStatus,
        user: { email: userEmail },
      } = appointmentToUpdate;

      const { userId, caregiverInfo } = singleAppointment;

      const caregiverUser = caregiverInfo.user;

      switch (appointmentStatus) {
        case AppointmentStatus.Rejected:
          if (appointmentToUpdateStatus === AppointmentStatus.Pending) {
            const notificationRecipient =
              role === UserRole.Caregiver ? userId : caregiverUser.id;

            this.notificationService.createNotification(
              notificationRecipient,
              appointmentId,
              NotificationMessage.RequestRejected,
              role === UserRole.Caregiver ? caregiverUser.id : userId,
            );
          } else {
            this.notificationService.createNotification(
              userId,
              appointmentId,
              NotificationMessage.RejectedAppointment,
              caregiverUser.id,
            );
            this.notificationService.createNotification(
              caregiverUser.id,
              appointmentId,
              NotificationMessage.RejectedAppointment,
              userId,
            );
          }

          await this.appointmentRepository.manager.transaction(
            async (transactionalEntityManager) => {
              await this.paymentService.payForHourOfWork(
                userId,
                caregiverInfo.id,
                transactionalEntityManager,
                true,
              );
            },
          );
          break;

        case AppointmentStatus.Accepted:
          this.notificationService.createNotification(
            userId,
            appointmentId,
            NotificationMessage.RequestAccepted,
            caregiverUser.id,
          );
          break;

        case AppointmentStatus.Pending:
          this.notificationService.createNotification(
            caregiverUser.id,
            appointmentId,
            NotificationMessage.RequestedAppointment,
            userId,
          );
          break;

        default:
          break;
      }

      const templateId = this.getTemplateIdForStatus(appointmentStatus);

      if (!templateId) {
        return;
      }

      await this.emailService.sendEmail({
        to: userEmail,
        templateId,
        dynamicTemplateData: {
          appointmentLink: this.seekerAppointmentRedirectLink,
        },
      });
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedUpdateAppointment,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteById(appointmentId: string): Promise<void> {
    try {
      const appointment = await this.findOneById(appointmentId);

      if (!appointment) {
        throw new HttpException(
          ErrorMessage.AppointmentNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      if (appointment.status !== AppointmentStatus.Finished) {
        throw new HttpException(
          ErrorMessage.UncompletedAppointmentDelete,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.appointmentRepository
        .createQueryBuilder('appointment')
        .delete()
        .from(Appointment)
        .where('id = :id', { id: appointmentId })
        .execute();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private getTemplateIdForStatus(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.Accepted:
        return this.caregiverAppointmentRequestAcceptTemplateId;
      case AppointmentStatus.Rejected:
        return this.caregiverAppointmentRequestRejectTemplateId;
      default:
        return '';
    }
  }
}
