import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { format, getDay, differenceInWeeks } from 'date-fns';
import { ActivityLog } from 'src/common/entities/activity-log.entity';
import { Appointment } from 'src/common/entities/appointment.entity';
import { TransactionHistory } from 'src/common/entities/transaction-history.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { AppointmentService } from 'src/modules/appointment/appointment.service';
import { EntityManager, Repository } from 'typeorm';

import { ActivityLogStatus } from '../activity-log/enums/activity-log-status.enum';
import { MINIMUM_BALANCE } from '../appointment/appointment.constants';
import { AppointmentStatus } from '../appointment/enums/appointment-status.enum';
import { CaregiverInfoService } from '../caregiver-info/caregiver-info.service';
import { UserRole } from '../users/enums/user-role.enum';
import { UserService } from '../users/user.service';

import { ALREADY_PAID_HOUR, ONE_WEEK } from './constants/payment.constants';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionType } from './enums/transaction-type.enum';
import { getHourDifference } from './helpers/difference-in-hours';
import { Transaction } from './types/transaction-history.type';

@Injectable()
export class PaymentService {
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
  ) {}

  public async payForHourOfWork(
    userId: string,
    caregiverInfoId: string,
    transactionalEntityManager: EntityManager,
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
  ): Promise<void> {
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
        (appointmentDuration + ALREADY_PAID_HOUR) * caregiverInfo.hourlyRate;

      const { userId } = appointment;
      const seeker = await this.userService.findById(userId);

      if (seeker.balance < amountToPay) {
        throw new HttpException(
          ErrorMessage.InsufficientFunds,
          HttpStatus.BAD_REQUEST,
        );
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
  ): Promise<void> {
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

      const dayName = format(getDay(new Date()), 'EEEE');
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

        if (JSON.parse(appointment.weekday).length === activityLogs.length) {
          await this.chargeForRecurringAppointment(appointmentId);
        } else if (new Date() === appointment.endDate) {
          await this.chargeForRecurringAppointment(appointmentId);
          await this.appointmentRepository.update(
            { id: appointmentId },
            { status: AppointmentStatus.Finished },
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
          await this.payForCompletedOneTimeAppointment(
            appointmentId,
            transactionalEntityManager,
          );
          await this.appointmentRepository.update(
            { id: appointmentId },
            { status: AppointmentStatus.Finished },
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

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async chargeForRecurringAppointment(
    appointmentId: string,
  ): Promise<void> {
    try {
      await this.appointmentRepository.manager.transaction(
        async (transactionalEntityManager) => {
          await this.payForCompletedRecurringAppointment(
            appointmentId,
            transactionalEntityManager,
          );
          await this.activityLogRepository.update(
            { appointmentId, status: ActivityLogStatus.Approved },
            { status: ActivityLogStatus.Closed },
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
}
