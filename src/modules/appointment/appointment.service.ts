import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { ONE_DAY } from 'src/common/constants/constants';
import {
  DATE_FORMAT,
  TODAY_DATE,
  ZERO,
} from 'src/common/constants/date.constants';
import { Appointment } from 'src/common/entities/appointment.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { NotificationMessage } from 'src/common/enums/notification-message.enum';
import { isAppointmentDate } from 'src/common/helpers/is-appointment-date.helper';
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
import { Between, EntityManager, Repository } from 'typeorm';

import { NotificationService } from '../notification/notification.service';
import { TransactionType } from '../payment/enums/transaction-type.enum';
import { PaymentService } from '../payment/payment.service';
import { UserRole } from '../users/enums/user-role.enum';
import { UTC_TIMEZONE } from '../virtual-assessment/constants/virtual-assessment.constant';

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

  private readonly seekerAppointmentRejectTemplateId =
    this.configService.get<string>(
      'SENDGRID_APPOINTMENT_REQUEST_REJECT_TEMPLATE_ID',
    );

  private readonly appointmentsRedirectLink = this.configService.get<string>(
    'APPOINTMENTS_REDIRECT_LINK',
  );

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

        .leftJoinAndSelect('appointment.activityLog', 'activityLog')

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

          const { hourlyRate: payment, isSufficientCost: paidForFirstHour } =
            await this.paymentService.payForHourOfWork(
              userId,
              createAppointment.caregiverInfoId,
              transactionalEntityManager,
            );

          const appointmentId = await this.registerNewAppointment(
            transactionalEntityManager,
            { ...appointment, payment, paidForFirstHour },
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

          await this.paymentService.createTransaction(
            {
              userId,
              type: TransactionType.Outcome,
              amount: caregiverInfo.hourlyRate,
              appointmentId,
            },
            transactionalEntityManager,
          );

          await this.sendAppointmentConfirmationEmails(
            userId,
            createAppointment.caregiverInfoId,
            appointmentId,
          );
        },
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
    appointmentId: string,
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
          link: this.appointmentsRedirectLink,
        },
      });

      await this.emailService.sendEmail({
        to: caregiverInfo.user.email,
        templateId: this.caregiverAppointmentTemplateId,
        dynamicTemplateData: {
          link: this.appointmentsRedirectLink,
        },
      });

      this.notificationService.createNotification(
        caregiverInfo.user.id,
        appointmentId,
        NotificationMessage.RequestedAppointment,
        userId,
      );
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
        .orderBy('appointment.createdAt', SortOrder.DESC)
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

      const currentDate = format(TODAY_DATE, DATE_FORMAT);

      const appointments = await this.appointmentRepository
        .createQueryBuilder('appointment')

        .innerJoin('appointment.caregiverInfo', 'caregiverInfo')
        .addSelect(['caregiverInfo.id', 'caregiverInfo.timeZone'])

        .innerJoin('appointment.user', 'user')
        .addSelect(['user.id', 'user.lastName', 'user.firstName'])

        .leftJoin('appointment.virtualAssessment', 'virtualAssessment')
        .addSelect([
          'virtualAssessment.id',
          'virtualAssessment.status',
          'virtualAssessment.startTime',
          'virtualAssessment.assessmentDate',
        ])

        .andWhere('(appointment.status  NOT IN (:...statuses)', {
          statuses: [
            AppointmentStatus.Virtual,
            AppointmentStatus.SignedSeeker,
            AppointmentStatus.SignedCaregiver,
            AppointmentStatus.Pending,
          ],
        })

        .orWhere('appointment.status IN (:...statuses)', {
          statuses: [
            AppointmentStatus.Virtual,
            AppointmentStatus.SignedSeeker,
            AppointmentStatus.SignedCaregiver,
          ],
        })
        .andWhere('DATE(virtualAssessment.assessmentDate) = :date', { date })

        .orWhere('appointment.status = :status', {
          status: AppointmentStatus.Pending,
        })
        .andWhere(':date = :currentDate)', {
          date,
          currentDate,
        })

        .andWhere('caregiverInfo.userId = :userId', { userId })

        .orderBy(
          `CASE
              WHEN appointment.status = "${AppointmentStatus.Active}" THEN 1
              WHEN appointment.status IN ("${AppointmentStatus.Virtual}", "${AppointmentStatus.SignedSeeker}", "${AppointmentStatus.SignedCaregiver}") THEN 2
              WHEN appointment.status = "${AppointmentStatus.Pending}" THEN 3
              WHEN appointment.status = "${AppointmentStatus.Paused}" THEN 4
              WHEN appointment.status = "${AppointmentStatus.Rejected}" THEN 6
              ELSE 5
            END`,
          SortOrder.ASC,
        )

        .getMany();

      const dateAppointments = appointments.filter((appointment) => {
        const startDate = utcToZonedTime(
          appointment.startDate,
          appointment.timezone,
        );
        const endDate = utcToZonedTime(
          appointment.endDate,
          appointment.timezone,
        );
        const providedDate = utcToZonedTime(new Date(date), UTC_TIMEZONE);

        const startOfDayStartDate = startOfDay(startDate);
        const endOfDayEndDate = endOfDay(endDate);

        const isDateInRange =
          (appointment.status === AppointmentStatus.Pending &&
            currentDate === date) ||
          appointment.status === AppointmentStatus.Virtual ||
          appointment.status === AppointmentStatus.SignedCaregiver ||
          appointment.status === AppointmentStatus.SignedSeeker ||
          (providedDate >= startOfDayStartDate &&
            providedDate <= endOfDayEndDate);

        return isDateInRange;
      });

      const filteredAppointments = dateAppointments.filter((appointment) =>
        appointment.type === TypeOfAppointment.Recurring
          ? isAppointmentDate(
              appointment.weekday,
              new Date(date),
              appointment.pausedAt ? new Date(appointment.pausedAt) : null,
            )
          : true,
      );

      return filteredAppointments;
    } catch (error) {
      throw new HttpException(
        ErrorMessage.InternalServerError,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTodayUnpaidAppointments(): Promise<Appointment[]> {
    try {
      const currentDate = format(TODAY_DATE, DATE_FORMAT);

      const todayAppointments = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.user', 'user')
        .leftJoinAndSelect('appointment.caregiverInfo', 'caregiverInfo')
        .leftJoinAndSelect('caregiverInfo.user', 'caregiverUser')
        .where('DATE(appointment.startDate) = :startDate', {
          startDate: currentDate,
        })
        .andWhere('appointment.paidForFirstHour = :paidForFirstHour', {
          paidForFirstHour: false,
        })
        .andWhere('appointment.status != :rejectedStatus', {
          rejectedStatus: 'Rejected',
        })
        .select([
          'appointment',
          'user.id',
          'caregiverInfo.id',
          'caregiverUser.id as caregiverUserId',
        ])
        .getMany();

      return todayAppointments;
    } catch (error) {
      throw new HttpException(
        ErrorMessage.InternalServerError,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllUnpaidAppointments(userId: string): Promise<Appointment[]> {
    try {
      return await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.userId = :userId', { userId })
        .andWhere('appointment.paidForFirstHour = :paidForFirstHour', {
          paidForFirstHour: false,
        })
        .orderBy('appointment.createdAt', SortOrder.ASC)
        .getMany();
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
      .andWhere('appointment.startDate <= :now', {
        now: utcToZonedTime(new Date(), UTC_TIMEZONE),
      })
      .getMany();

    return appointments;
  }

  async checkRecurringAppointmentToBePaid(): Promise<Appointment[]> {
    return this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.status IN (:...statuses)', {
        statuses: [
          AppointmentStatus.Completed,
          AppointmentStatus.Active,
          AppointmentStatus.Paused,
        ],
      })
      .andWhere('appointment.type = :recurring', {
        recurring: TypeOfAppointment.Recurring,
      })
      .andWhere('appointment.seekerDebt > :seekerDebt', {
        seekerDebt: 0,
      })
      .getMany();
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
      const notificationRecipient =
        role === UserRole.Caregiver ? userId : caregiverUser.id;

      switch (appointmentStatus) {
        case AppointmentStatus.Rejected:
          if (appointmentToUpdateStatus === AppointmentStatus.Pending) {
            this.notificationService.createNotification(
              notificationRecipient,
              appointmentId,
              NotificationMessage.RequestRejected,
              role === UserRole.Caregiver ? caregiverUser.id : userId,
            );
          } else {
            this.notificationService.createNotification(
              notificationRecipient,
              appointmentId,
              NotificationMessage.RejectedAppointment,
              role === UserRole.Caregiver ? caregiverUser.id : userId,
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
              await this.paymentService.createSeekerCaregiverTransactions(
                caregiverInfo.user.id,
                userId,
                caregiverInfo.hourlyRate,
                transactionalEntityManager,
                appointmentId,
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

      const templateId = this.getTemplateIdForStatus(appointmentStatus, role);

      if (!templateId) {
        return;
      }

      await this.emailService.sendEmail({
        to: userEmail,
        templateId,
        dynamicTemplateData: {
          appointmentLink: this.appointmentsRedirectLink,
        },
      });
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedUpdateAppointment,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async cancelUnpaidAppointment(appointmentId: string): Promise<void> {
    try {
      const appointment = await this.findOneById(appointmentId);

      if (!appointment) {
        throw new HttpException(
          ErrorMessage.AppointmentNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.appointmentRepository
        .createQueryBuilder()
        .update(Appointment)
        .set({ status: AppointmentStatus.Rejected })
        .where('appointment.id = :appointmentId', {
          appointmentId,
        })
        .execute();

      await this.notificationService.createNotification(
        appointment.user.id,
        appointmentId,
        NotificationMessage.InsufficientFirstHourPayment,
        appointment.caregiverInfo.user.id,
      );

      await this.notificationService.createNotification(
        appointment.caregiverInfo.user.id,
        appointmentId,
        NotificationMessage.InsufficientFirstHourPayment,
        appointment.user.id,
      );
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

  private getTemplateIdForStatus(
    status: AppointmentStatus,
    role: UserRole,
  ): string {
    switch (status) {
      case AppointmentStatus.Accepted:
        return this.caregiverAppointmentRequestAcceptTemplateId;
      case AppointmentStatus.Rejected:
        if (role === UserRole.Caregiver) {
          return this.caregiverAppointmentRequestRejectTemplateId;
        }
        if (role === UserRole.Seeker) {
          return this.seekerAppointmentRejectTemplateId;
        }
        break;
      default:
        return '';
    }
  }

  async updateByIdWithTransaction(
    appointmentId: string,
    appointment: Partial<Appointment>,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    try {
      await transactionalEntityManager
        .createQueryBuilder()
        .update(Appointment)
        .set(appointment)
        .where('appointment.id = :appointmentId', {
          appointmentId,
        })
        .execute();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllAppointmentsOneDayAfterEndDate(): Promise<Appointment[]> {
    try {
      const oneDayAgo = subDays(new Date(), ONE_DAY);

      oneDayAgo.setMilliseconds(ZERO);
      oneDayAgo.setSeconds(ZERO);

      const appointments = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.endDate = :oneDayAgo', { oneDayAgo })
        .innerJoin('appointment.caregiverInfo', 'caregiverInfo')
        .leftJoin('caregiverInfo.seekerReviews', 'seekerReviews')
        .leftJoinAndSelect('seekerReviews.user', 'reviewUser')
        .andWhere(
          'reviewUser.id IS NULL OR reviewUser.id != appointment.userId',
        )
        .andWhere(
          'appointment.status = :finished OR appointment.status = :completed',
          {
            finished: AppointmentStatus.Finished,
            completed: AppointmentStatus.Completed,
          },
        )
        .innerJoinAndSelect('appointment.user', 'appointmentUser')
        .getMany();

      return appointments;
    } catch (error) {
      throw new HttpException(
        ErrorMessage.InternalServerError,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAppointmentsByTimeRange(
    startTime: Date,
    endTime: Date,
    weekdays: string[],
  ): Promise<Appointment[]> {
    try {
      const oneTimeAppointments = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where({
          type: TypeOfAppointment.OneTime,
          startDate: Between(startTime, endTime),
          endDate: Between(startTime, endTime),
        })
        .getMany();

      const recurringAppointments = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where({
          type: TypeOfAppointment.Recurring,
          startDate: Between(startTime, endTime),
          endDate: Between(startTime, endTime),
        })
        .getMany();

      const filteredRecurringAppointments = recurringAppointments.filter(
        (appointment) =>
          JSON.parse(appointment.weekday).some((day: string) =>
            weekdays.includes(day),
          ),
      );

      return [...oneTimeAppointments, ...filteredRecurringAppointments];
    } catch (error) {
      throw new HttpException(
        ErrorMessage.AppointmentNotFound,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
