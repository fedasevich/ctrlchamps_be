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
  getDay,
  differenceInWeeks,
  getHours,
  getMinutes,
  addWeeks,
  isSameDay,
  addDays,
  addMinutes,
} from 'date-fns';
import { ActivityLog } from 'src/common/entities/activity-log.entity';
import { Appointment } from 'src/common/entities/appointment.entity';
import { TransactionHistory } from 'src/common/entities/transaction-history.entity';
import { User } from 'src/common/entities/user.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { NotificationMessage } from 'src/common/enums/notification-message.enum';
import { AdminPanelService } from 'src/modules/admin-panel/admin-panel.service';
import { AppointmentService } from 'src/modules/appointment/appointment.service';
import { AppointmentType } from 'src/modules/appointment/enums/appointment-type.enum';
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

import {
  ALREADY_PAID_HOUR,
  FIVE_MINUTES,
  ONE_DAY,
  ONE_WEEK,
  TWO_DAYS,
  TWO_WEEKS,
} from './constants/payment.constants';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionType } from './enums/transaction-type.enum';
import { getHourDifference } from './helpers/difference-in-hours';
import { Transaction } from './types/transaction-history.type';

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
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly adminPanelService: AdminPanelService,
    private readonly notificationService: NotificationService,
  ) {}

  public async payForHourOfWork(
    userId: string,
    caregiverInfoId: string,
    transactionalEntityManager: EntityManager,
    payBack = false,
  ): Promise<number> {
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

      if (payBack) {
        const updatedSeekerBalance = balance + caregiverInfo.hourlyRate;

        await this.userService.updateWithTransaction(
          email,
          { balance: updatedSeekerBalance },
          transactionalEntityManager,
        );

        return caregiverInfo.hourlyRate;
      }

      const updatedSeekerBalance = balance - caregiverInfo.hourlyRate;

      if (updatedSeekerBalance >= MINIMUM_BALANCE) {
        await this.userService.updateWithTransaction(
          email,
          { balance: updatedSeekerBalance },
          transactionalEntityManager,
        );
      }

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
        await this.checkSeekerDebt(
          seeker,
          endDate,
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

      const today = new Date();
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
        await this.checkSeekerDebt(
          seeker,
          endDate,
          caregiverInfo.user,
          appointment,
          transactionalEntityManager,
        );

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
      console.log('in chargeRecurringPaymentTask');
      console.log('new Date()', new Date());

      const dayName = format(getDay(new Date()), 'EEEE');
      console.log('dayName', dayName);
      console.log('getDay(new Date())', getDay(new Date()));

      console.log(
        'JSON.parse(appointment.weekday)[0]',
        JSON.parse(appointment.weekday)[0],
      );

      if (dayName === JSON.parse(appointment.weekday)[0]) {
        const activityLogs = await this.activityLogRepository
          .createQueryBuilder('activityLog')
          .where('activityLog.status IN (:...statuses)', {
            statuses: [ActivityLogStatus.Approved, ActivityLogStatus.Rejected],
          })
          .andWhere('activityLog.appointmentId = :appointmentId', {
            appointmentId,
          })
          .getMany();
        console.log('activityLogs', activityLogs);
        console.log(
          'JSON.parse(appointment.weekday).length',
          JSON.parse(appointment.weekday).length,
        );

        if (JSON.parse(appointment.weekday).length === activityLogs.length) {
          console.log('isPaymentSuccessful тру первый иф рекьюр');

          const isPaymentSuccessful =
            await this.chargeForRecurringAppointment(appointmentId);

          if (
            isPaymentSuccessful &&
            appointment.status === AppointmentStatus.Paused
          ) {
            await this.appointmentRepository.update(
              { id: appointmentId },
              { status: AppointmentStatus.Active },
            );
          }
        } else if (new Date() === appointment.endDate) {
          const isPaymentSuccessful =
            await this.chargeForRecurringAppointment(appointmentId);
          console.log('new Date() === appointment.endDate');

          if (isPaymentSuccessful) {
            console.log('before  AppointmentStatus.Finished');

            await this.appointmentRepository.update(
              { id: appointmentId },
              { status: AppointmentStatus.Finished },
            );
          }

          console.log(
            'isPaymentSuccessful after AppointmentStatus.Finished',
            isPaymentSuccessful,
          );
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
          console.log('isPaymentSuccessful before changing ActivityLogStatus');

          if (isPaymentSuccessful) {
            console.log('isPaymentSuccessful', true);

            await this.activityLogRepository.update(
              { appointmentId, status: ActivityLogStatus.Approved },
              { status: ActivityLogStatus.Closed },
            );

            console.log('after activityLogRepository.update');
          }
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

  async getTransactionHistory(userId: string): Promise<Transaction[]> {
    try {
      const transactions = await this.transactionHistoryRepository
        .createQueryBuilder('transactions')
        .where('userId = :userId', {
          userId,
        })
        .orderBy('transactions.createdAt', 'DESC')
        .getMany();

      return transactions;
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

      await this.userService.updateUserInfo(userId, {
        balance: updatedBalance,
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async checkSeekerDebt(
    seeker: User,
    endDate: Date,
    caregiver: User,
    appointment: Appointment,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    try {
      const currentDate = new Date();
      const actualDebtStatus =
        appointment.debtStatus === DebtStatus.Absent
          ? DebtStatus.NotAccrued
          : appointment.debtStatus;

      if (appointment.debtStatus === DebtStatus.Absent) {
        await this.appointmentService.updateByIdWithTransaction(
          appointment.id,
          { debtStatus: DebtStatus.NotAccrued },
          transactionalEntityManager,
        );
      }

      if (
        actualDebtStatus === DebtStatus.NotAccrued &&
        isSameDay(endDate, currentDate)
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
      }

      if (
        (isSameDay(addDays(endDate, ONE_DAY), currentDate) ||
          isSameDay(addWeeks(endDate, ONE_WEEK), currentDate) ||
          isSameDay(addWeeks(endDate, TWO_WEEKS), currentDate)) &&
        getHours(endDate) === getHours(currentDate) &&
        (getMinutes(endDate) === getMinutes(currentDate) ||
          getMinutes(addMinutes(currentDate, FIVE_MINUTES)) ===
            getMinutes(endDate))
      ) {
        await this.notifySeekerAndAdminsAboutDebt(
          seeker,
          caregiver,
          appointment.id,
        );
      }

      if (
        isSameDay(addDays(endDate, TWO_DAYS), currentDate) &&
        getHours(endDate) === getHours(currentDate) &&
        (getMinutes(endDate) === getMinutes(currentDate) ||
          getMinutes(addMinutes(currentDate, FIVE_MINUTES)) ===
            getMinutes(endDate))
      ) {
        if (appointment.type === AppointmentType.Recurring) {
          await this.appointmentService.updateByIdWithTransaction(
            appointment.id,
            { status: AppointmentStatus.Paused },
            transactionalEntityManager,
          );
        }

        await this.emailService.sendEmail({
          to: caregiver.email,
          templateId: this.caregiverAppointmentPausedTemplateId,
          dynamicTemplateData: {
            caregiverName: `${caregiver.firstName} ${caregiver.lastName}`,
            seekerName: `${seeker.firstName} ${seeker.lastName}`,
            appointmentName: appointment.name,
          },
        });

        await this.notificationService.createNotification(
          caregiver.id,
          appointment.id,
          NotificationMessage.PausedAppointment,
          seeker.id,
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

      // const admins = await this.adminPanelService.getAllAdmins();

      // await this.emailService.sendEmail({
      //   to: admins.map((admin) => admin.email),
      //   templateId: this.allAdminsPaymentReminderTemplateId,
      //   dynamicTemplateData: {
      //     seekerName: `${seeker.firstName} ${seeker.lastName}`,
      //     seekerId: seeker.id,
      //     caregiverName: `${caregiver.firstName} ${caregiver.lastName}`,
      //     appointmentId,
      //   },
      // });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
