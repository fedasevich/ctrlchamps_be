import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import {
  format,
  differenceInWeeks,
  getHours,
  getMinutes,
  addWeeks,
  isSameDay,
  addDays,
  subDays,
  subWeeks,
  isSameMinute,
} from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { ActivityLog } from 'src/common/entities/activity-log.entity';
import { Appointment } from 'src/common/entities/appointment.entity';
import { TransactionHistory } from 'src/common/entities/transaction-history.entity';
import { User } from 'src/common/entities/user.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { NotificationMessage } from 'src/common/enums/notification-message.enum';
import { isMoreAppointmentDays } from 'src/common/helpers/is-more-appointments-days';
import { AdminPanelService } from 'src/modules/admin-panel/admin-panel.service';
import { AppointmentService } from 'src/modules/appointment/appointment.service';
import { DebtStatus } from 'src/modules/appointment/enums/debt-status.enum';
import { EmailService } from 'src/modules/email/services/email.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { EntityManager, Repository } from 'typeorm';

import { ActivityLogStatus } from '../activity-log/enums/activity-log-status.enum';
import { MINIMUM_BALANCE } from '../appointment/appointment.constants';
import { AppointmentStatus } from '../appointment/enums/appointment-status.enum';
import { CaregiverInfoService } from '../caregiver-info/caregiver-info.service';
import { UserRole } from '../users/enums/user-role.enum';
import { UserService } from '../users/user.service';
import { UTC_TIMEZONE } from '../virtual-assessment/constants/virtual-assessment.constant';

import {
  ALREADY_PAID_HOUR,
  ONE_DAY,
  TWO_DAYS,
  TWO_WEEKS,
  ONE_WEEK,
  TRANSACTION_PAGINATION_LIMIT,
} from './constants/payment.constants';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionType } from './enums/transaction-type.enum';
import { getHourDifference } from './helpers/difference-in-hours';
import { findNextDay } from './helpers/find-closest-day-to-date';
import { PayForHourOfWorkResponse } from './types/payment-response.type';
import {
  TransactionQuery,
  TransactionsListResponse,
} from './types/transaction-query.type';

@Injectable()
export class PaymentService {
  private readonly seekerPaymentReminderTemplateId =
    this.configService.get<string>(
      'SENDGRID_SEEKER_PAYMENT_REMINDER_TEMPLATE_ID',
    );

  private readonly allAdminsPaymentReminderTemplateId =
    this.configService.get<string>(
      'SENDGRID_ALL_ADMINS_PAYMENT_REMINDER_TEMPLATE_ID',
    );

  private readonly caregiverAppointmentPausedTemplateId =
    this.configService.get<string>(
      'SENDGRID_CAREGIVER_APPOINTMENT_PAUSED_TEMPLATE_ID',
    );

  private readonly seekerBalanceLowTemplateId = this.configService.get<string>(
    'SENDGRID_INSUFFICIENT_APPOINTMENT_CREATION_BALANCE_TEMPLATE_ID',
  );

  private readonly caregiverResumeAppointmentTemplateId =
    this.configService.get<string>(
      'SENDGRID_CAREGIVER_RESUME_APPOINTMENT_TEMPLATE_ID',
    );

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(TransactionHistory)
    private readonly transactionHistoryRepository: Repository<TransactionHistory>,
    @Inject(forwardRef(() => AppointmentService))
    private appointmentService: AppointmentService,
    private readonly userService: UserService,
    private readonly caregiverInfoService: CaregiverInfoService,
    private readonly adminPanelService: AdminPanelService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  public async payForHourOfWork(
    userId: string,
    caregiverInfoId: string,
    transactionalEntityManager: EntityManager,
    payBack = false,
  ): Promise<PayForHourOfWorkResponse> {
    try {
      const { balance, email } = await this.userService.findById(userId);

      const caregiverInfo =
        await this.caregiverInfoService.findUserByCaregiverInfoId(
          caregiverInfoId,
        );

      if (!caregiverInfo) {
        throw new HttpException(
          ErrorMessage.CaregiverInfoNotFound,
          HttpStatus.BAD_REQUEST,
        );
      }

      const isSufficientCost = balance >= caregiverInfo.hourlyRate;

      if (payBack) {
        const updatedSeekerBalance = balance + caregiverInfo.hourlyRate;

        await this.userService.updateWithTransaction(
          email,
          { balance: updatedSeekerBalance },
          transactionalEntityManager,
        );

        return { hourlyRate: caregiverInfo.hourlyRate, isSufficientCost };
      }

      const updatedSeekerBalance = balance - caregiverInfo.hourlyRate;

      if (updatedSeekerBalance >= MINIMUM_BALANCE) {
        await this.userService.updateWithTransaction(
          email,
          { balance: updatedSeekerBalance },
          transactionalEntityManager,
        );
      } else {
        await this.emailService.sendEmail({
          to: email,
          templateId: this.seekerBalanceLowTemplateId,
        });
      }

      return { hourlyRate: caregiverInfo.hourlyRate, isSufficientCost };
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

  private async payForCompletedOneTimeAppointment(
    appointmentId: string,
    transactionalEntityManager: EntityManager,
  ): Promise<boolean> {
    try {
      const appointment =
        await this.appointmentService.findOneById(appointmentId);

      if (!appointment) {
        throw new HttpException(
          ErrorMessage.AppointmentNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const { startDate, endDate } = appointment;
      const appointmentDuration = getHourDifference(startDate, endDate);

      const { caregiverInfoId } = appointment;
      const caregiverInfo =
        await this.caregiverInfoService.findUserByCaregiverInfoId(
          caregiverInfoId,
        );

      if (!caregiverInfo) {
        throw new HttpException(
          ErrorMessage.CaregiverInfoNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const amountToPay =
        (appointmentDuration - ALREADY_PAID_HOUR) * caregiverInfo.hourlyRate;

      const { userId } = appointment;
      const seeker = await this.userService.findById(userId);

      if (seeker.balance < amountToPay) {
        await this.checkSeekerOneTimeDebt(
          seeker,
          caregiverInfo.user,
          appointment,
          transactionalEntityManager,
        );

        return false;
      }

      const seekerUpdatedBalance = seeker.balance - amountToPay;

      await this.userService.updateWithTransaction(
        seeker.email,
        {
          balance: seekerUpdatedBalance,
        },
        transactionalEntityManager,
      );

      const caregiverUpdatedBalance = caregiverInfo.user.balance + amountToPay;

      await this.userService.updateWithTransaction(
        caregiverInfo.user.email,
        {
          balance: caregiverUpdatedBalance,
        },
        transactionalEntityManager,
      );

      await this.createSeekerCaregiverTransactions(
        userId,
        caregiverInfo.user.id,
        amountToPay,
        transactionalEntityManager,
        appointmentId,
      );

      return true;
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

  private async payForCompletedRecurringAppointment(
    appointmentId: string,
    transactionalEntityManager: EntityManager,
  ): Promise<boolean> {
    try {
      const appointment =
        await this.appointmentService.findOneById(appointmentId);

      if (!appointment) {
        throw new HttpException(
          ErrorMessage.AppointmentNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const { caregiverInfoId } = appointment;
      const caregiverInfo =
        await this.caregiverInfoService.findUserByCaregiverInfoId(
          caregiverInfoId,
        );

      if (!caregiverInfo) {
        throw new HttpException(
          ErrorMessage.CaregiverInfoNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const { userId } = appointment;
      const seeker = await this.userService.findById(userId);

      const acceptedActivityLogs = await this.activityLogRepository
        .createQueryBuilder('activityLog')
        .where('activityLog.status = :status', {
          status: ActivityLogStatus.Approved,
        })
        .andWhere('activityLog.appointmentId = :appointmentId', {
          appointmentId,
        })
        .getMany();

      const { startDate, endDate } = appointment;

      const today = utcToZonedTime(new Date(), UTC_TIMEZONE);
      const weeksDifference = differenceInWeeks(today, startDate);
      const appointmentDuration = getHourDifference(startDate, endDate);
      let payForCompletedRecurringAppointment: number;

      if (weeksDifference >= ONE_WEEK) {
        payForCompletedRecurringAppointment =
          acceptedActivityLogs.length *
            caregiverInfo.hourlyRate *
            appointmentDuration -
          caregiverInfo.hourlyRate;
      } else {
        payForCompletedRecurringAppointment =
          acceptedActivityLogs.length *
          caregiverInfo.hourlyRate *
          appointmentDuration;
      }

      if (seeker.balance < payForCompletedRecurringAppointment) {
        if (appointment.seekerDebt === 0) {
          await this.appointmentService.updateByIdWithTransaction(
            appointmentId,
            { seekerDebt: payForCompletedRecurringAppointment },
            transactionalEntityManager,
          );

          await this.notifySeekerAndAdminsAboutDebt(
            seeker,
            caregiverInfo.user,
            appointment.id,
          );
        }

        return false;
      }

      const seekerUpdatedBalance =
        seeker.balance - payForCompletedRecurringAppointment;

      await this.userService.updateWithTransaction(
        seeker.email,
        {
          balance: seekerUpdatedBalance,
        },
        transactionalEntityManager,
      );

      const caregiverUpdatedBalance =
        caregiverInfo.user.balance + payForCompletedRecurringAppointment;

      await this.userService.updateWithTransaction(
        caregiverInfo.user.email,
        {
          balance: caregiverUpdatedBalance,
        },
        transactionalEntityManager,
      );

      await this.createSeekerCaregiverTransactions(
        userId,
        caregiverInfo.user.id,
        payForCompletedRecurringAppointment,
        transactionalEntityManager,
        appointmentId,
      );

      return true;
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

  public async chargeRecurringPaymentTask(
    appointmentId: string,
  ): Promise<void> {
    try {
      const appointment =
        await this.appointmentService.findOneById(appointmentId);

      const currentDate = utcToZonedTime(new Date(), UTC_TIMEZONE);

      const dayName = format(currentDate, 'EEEE');
      const firstSelectedWeekday = findNextDay(
        appointment.startDate,
        JSON.parse(appointment.weekday),
      );

      if (dayName === firstSelectedWeekday) {
        const activityLogs = await this.activityLogRepository
          .createQueryBuilder('activityLog')
          .where('activityLog.status IN (:...statuses)', {
            statuses: [ActivityLogStatus.Approved, ActivityLogStatus.Rejected],
          })
          .andWhere('activityLog.appointmentId = :appointmentId', {
            appointmentId,
          })
          .getMany();

        if (JSON.parse(appointment.weekday).length === activityLogs.length) {
          await this.chargeForRecurringAppointment(appointmentId);
        } else if (
          isSameDay(currentDate, appointment.endDate) &&
          isSameMinute(currentDate, appointment.endDate)
        ) {
          const isPaymentSuccessful =
            await this.chargeForRecurringAppointment(appointmentId);

          if (isPaymentSuccessful) {
            await this.appointmentRepository.update(
              { id: appointmentId },
              {
                status: AppointmentStatus.Finished,
                debtStatus: DebtStatus.Absent,
              },
            );
          }
        }
      }
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

  public async chargeForOneTimeAppointment(
    appointmentId: string,
  ): Promise<void> {
    try {
      await this.appointmentRepository.manager.transaction(
        async (transactionalEntityManager) => {
          const isPaymentSuccessful =
            await this.payForCompletedOneTimeAppointment(
              appointmentId,
              transactionalEntityManager,
            );

          if (isPaymentSuccessful) {
            await this.appointmentService.updateByIdWithTransaction(
              appointmentId,
              {
                status: AppointmentStatus.Finished,
                debtStatus: DebtStatus.Absent,
              },
              transactionalEntityManager,
            );
          }
        },
      );
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

  private async chargeForRecurringAppointment(
    appointmentId: string,
  ): Promise<boolean> {
    try {
      let isPaymentSuccessful: boolean;

      await this.appointmentRepository.manager.transaction(
        async (transactionalEntityManager) => {
          isPaymentSuccessful = await this.payForCompletedRecurringAppointment(
            appointmentId,
            transactionalEntityManager,
          );

          await this.activityLogRepository.update(
            { appointmentId, status: ActivityLogStatus.Approved },
            { status: ActivityLogStatus.Closed },
          );
        },
      );

      return isPaymentSuccessful;
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

  async getTransactionHistory(
    userId: string,
    query: TransactionQuery,
  ): Promise<TransactionsListResponse> {
    try {
      const limit = query.limit || TRANSACTION_PAGINATION_LIMIT;
      const offset = query.offset || 0;

      const [result, total] = await this.transactionHistoryRepository
        .createQueryBuilder('transactions')
        .where('userId = :userId', {
          userId,
        })
        .orderBy('transactions.createdAt', 'DESC')
        .take(limit)
        .skip(offset)
        .getManyAndCount();

      return {
        data: result,
        count: total,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createTransaction(
    transaction: CreateTransactionDto,
    transactionalEntityManager?: EntityManager,
  ): Promise<void> {
    try {
      const user = await this.userService.findById(transaction.userId);

      if (!user) {
        throw new HttpException(
          ErrorMessage.UserIsNotAuthorized,
          HttpStatus.BAD_REQUEST,
        );
      }

      const repository =
        transactionalEntityManager ?? this.transactionHistoryRepository;

      await repository
        .createQueryBuilder()
        .insert()
        .into(TransactionHistory)
        .values(transaction)
        .execute();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createSeekerCaregiverTransactions(
    seekerId: string,
    caregiverId: string,
    amount: number,
    transactionalEntityManager: EntityManager,
    appointmentId?: string,
  ): Promise<void> {
    try {
      await this.createTransaction(
        {
          userId: seekerId,
          type: TransactionType.Outcome,
          amount,
          appointmentId,
        },
        transactionalEntityManager,
      );

      await this.createTransaction(
        {
          userId: caregiverId,
          type: TransactionType.Income,
          amount,
          appointmentId,
        },
        transactionalEntityManager,
      );
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

  public async updateBalance(
    userId: string,
    updatedBalance: number,
  ): Promise<void> {
    try {
      const user = await this.userService.findById(userId);

      if (user) {
        await this.createTransaction({
          userId,
          type:
            user.role === UserRole.Caregiver
              ? TransactionType.Outcome
              : TransactionType.Income,
          amount:
            user.role === UserRole.Caregiver
              ? user.balance - updatedBalance
              : updatedBalance - user.balance,
        });
      }

      const notPaidAppointments =
        await this.appointmentService.getAllUnpaidAppointments(userId);

      if (!notPaidAppointments.length) {
        await this.userService.updateUserInfo(userId, {
          balance: updatedBalance,
        });

        return;
      }

      let newlyUpdatedBalance = updatedBalance;

      notPaidAppointments.forEach(async (appointment) => {
        if (appointment.payment <= newlyUpdatedBalance) {
          await this.appointmentService.updateById(appointment.id, {
            paidForFirstHour: true,
          });

          newlyUpdatedBalance -= appointment.payment;
        }
      });

      await this.userService.updateUserInfo(userId, {
        balance: newlyUpdatedBalance,
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async checkSeekerOneTimeDebt(
    seeker: User,
    caregiver: User,
    appointment: Appointment,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    try {
      const currentDate = utcToZonedTime(new Date(), UTC_TIMEZONE);

      if (
        appointment.debtStatus === DebtStatus.Absent &&
        isSameDay(appointment.endDate, currentDate)
      ) {
        await this.appointmentService.updateByIdWithTransaction(
          appointment.id,
          { debtStatus: DebtStatus.Accrued },
          transactionalEntityManager,
        );

        await this.notifySeekerAndAdminsAboutDebt(
          seeker,
          caregiver,
          appointment.id,
        );

        return;
      }

      if (
        (isSameDay(addDays(appointment.endDate, ONE_DAY), currentDate) ||
          isSameDay(addWeeks(appointment.endDate, ONE_WEEK), currentDate) ||
          isSameDay(addWeeks(appointment.endDate, TWO_WEEKS), currentDate)) &&
        getHours(appointment.endDate) === getHours(currentDate) &&
        getMinutes(appointment.endDate) === getMinutes(currentDate)
      ) {
        await this.notifySeekerAndAdminsAboutDebt(
          seeker,
          caregiver,
          appointment.id,
        );

        return;
      }

      if (
        isSameDay(addDays(appointment.endDate, TWO_DAYS), currentDate) &&
        getHours(appointment.endDate) === getHours(currentDate) &&
        getMinutes(appointment.endDate) === getMinutes(currentDate)
      ) {
        await this.appointmentService.updateByIdWithTransaction(
          appointment.id,
          { debtStatus: DebtStatus.NotAccrued },
          transactionalEntityManager,
        );

        await this.emailService.sendEmail({
          to: caregiver.email,
          templateId: this.caregiverAppointmentPausedTemplateId,
          dynamicTemplateData: {
            caregiverName: `${caregiver.firstName} ${caregiver.lastName}`,
            seekerName: `${seeker.firstName} ${seeker.lastName}`,
            appointmentName: appointment.name,
          },
        });

        await this.notificationService.createNotificationWithTransaction(
          caregiver.id,
          appointment.id,
          NotificationMessage.PausedAppointment,
          seeker.id,
          transactionalEntityManager,
        );
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async notifySeekerAndAdminsAboutDebt(
    seeker: User,
    caregiver: User,
    appointmentId: string,
  ): Promise<void> {
    try {
      await this.emailService.sendEmail({
        to: seeker.email,
        templateId: this.seekerPaymentReminderTemplateId,
        dynamicTemplateData: {
          seekerName: `${seeker.firstName} ${seeker.lastName}`,
          caregiverName: `${caregiver.firstName} ${caregiver.lastName}`,
        },
      });

      const admins = await this.adminPanelService.getAllAdmins();

      await this.emailService.sendEmail({
        to: admins.map((admin) => admin.email),
        templateId: this.allAdminsPaymentReminderTemplateId,
        dynamicTemplateData: {
          seekerName: `${seeker.firstName} ${seeker.lastName}`,
          seekerId: seeker.id,
          caregiverName: `${caregiver.firstName} ${caregiver.lastName}`,
          appointmentId,
        },
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async chargeSeekerRecurringDebt(appointmentId: string): Promise<void> {
    try {
      const appointment =
        await this.appointmentService.findOneById(appointmentId);

      const seeker = await this.userService.findById(appointment.userId);

      const caregiverInfo =
        await this.caregiverInfoService.findUserByCaregiverInfoId(
          appointment.caregiverInfoId,
        );

      const currentDate = utcToZonedTime(new Date(), UTC_TIMEZONE);

      await this.appointmentRepository.manager.transaction(
        async (transactionalEntityManager) => {
          if (seeker.balance >= appointment.seekerDebt) {
            const seekerUpdatedBalance =
              seeker.balance - appointment.seekerDebt;

            await this.userService.updateWithTransaction(
              seeker.email,
              { balance: seekerUpdatedBalance },
              transactionalEntityManager,
            );

            const caregiverUpdatedBalance =
              caregiverInfo.user.balance + appointment.seekerDebt;

            await this.userService.updateWithTransaction(
              caregiverInfo.user.email,
              { balance: caregiverUpdatedBalance },
              transactionalEntityManager,
            );

            await this.createSeekerCaregiverTransactions(
              seeker.id,
              caregiverInfo.user.id,
              appointment.seekerDebt,
              transactionalEntityManager,
              appointment.id,
            );

            await this.appointmentService.updateByIdWithTransaction(
              appointment.id,
              { seekerDebt: 0, debtStatus: DebtStatus.Absent },
              transactionalEntityManager,
            );

            const isAppointmentHasOneMoreDay = isMoreAppointmentDays(
              appointment.endDate,
              appointment.weekday,
              currentDate,
            );

            if (
              appointment.status === AppointmentStatus.Paused &&
              isAppointmentHasOneMoreDay
            ) {
              await this.appointmentService.updateByIdWithTransaction(
                appointment.id,
                { status: AppointmentStatus.Active, pausedAt: null },
                transactionalEntityManager,
              );

              await this.emailService.sendEmail({
                to: caregiverInfo.user.email,
                templateId: this.caregiverResumeAppointmentTemplateId,
                dynamicTemplateData: {
                  caregiverName: `${caregiverInfo.user.firstName} ${caregiverInfo.user.lastName}`,
                  seekerName: `${seeker.firstName} ${seeker.lastName}`,
                  appointmentName: appointment.name,
                },
              });

              await this.notificationService.createNotificationWithTransaction(
                caregiverInfo.user.id,
                appointment.id,
                NotificationMessage.ResumeAppointment,
                seeker.id,
                transactionalEntityManager,
              );
            }
          } else if (seeker.balance < appointment.seekerDebt) {
            const firstSelectedWeekday = findNextDay(
              appointment.startDate,
              JSON.parse(appointment.weekday),
            );

            if (
              (firstSelectedWeekday ===
                format(subDays(currentDate, TWO_DAYS), 'EEEE') ||
                isSameDay(
                  appointment.endDate,
                  subDays(currentDate, TWO_DAYS),
                )) &&
              appointment.status === AppointmentStatus.Active
            ) {
              await this.appointmentService.updateByIdWithTransaction(
                appointment.id,
                {
                  status: AppointmentStatus.Paused,
                  debtStatus: DebtStatus.NotAccrued,
                  pausedAt: currentDate,
                },
                transactionalEntityManager,
              );

              await this.emailService.sendEmail({
                to: caregiverInfo.user.email,
                templateId: this.caregiverAppointmentPausedTemplateId,
                dynamicTemplateData: {
                  caregiverName: `${caregiverInfo.user.firstName} ${caregiverInfo.user.lastName}`,
                  seekerName: `${seeker.firstName} ${seeker.lastName}`,
                  appointmentName: appointment.name,
                },
              });

              await this.notificationService.createNotificationWithTransaction(
                caregiverInfo.user.id,
                appointment.id,
                NotificationMessage.PausedAppointment,
                seeker.id,
                transactionalEntityManager,
              );

              return;
            }

            if (
              (firstSelectedWeekday ===
                format(subDays(currentDate, ONE_DAY), 'EEEE') ||
                firstSelectedWeekday ===
                  format(subWeeks(currentDate, ONE_WEEK), 'EEEE') ||
                firstSelectedWeekday ===
                  format(subWeeks(currentDate, TWO_WEEKS), 'EEEE')) &&
              getHours(appointment.endDate) === getHours(currentDate) &&
              getMinutes(appointment.endDate) === getMinutes(currentDate)
            ) {
              await this.notifySeekerAndAdminsAboutDebt(
                seeker,
                caregiverInfo.user,
                appointment.id,
              );
            }
          }
        },
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
