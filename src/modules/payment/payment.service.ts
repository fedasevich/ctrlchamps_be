import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { format, getDay, differenceInWeeks } from 'date-fns';
import { ActivityLog } from 'src/common/entities/activity-log.entity';
import { Appointment } from 'src/common/entities/appointment.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { EntityManager, Repository } from 'typeorm';

import { ActivityLogStatus } from '../activity-log/enums/activity-log-status.enum';
import { MINIMUM_BALANCE } from '../appointment/appointment.constants';
import { AppointmentStatus } from '../appointment/enums/appointment-status.enum';
import { CaregiverInfoService } from '../caregiver-info/caregiver-info.service';
import { UserService } from '../users/user.service';

import { getHourDifference } from './helpers/difference-in-hours';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly userService: UserService,
    private readonly caregiverInfoService: CaregiverInfoService,
  ) {}

  private async findAppointmentById(
    appointmentId: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.id = :appointmentId', { appointmentId })
      .getOne();

    return appointment;
  }

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

  private async payForCompletedOneTimeAppointment(
    appointmentId: string,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    try {
      const appointment = await this.findAppointmentById(appointmentId);

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

      const amountToPay = (appointmentDuration + 1) * caregiverInfo.hourlyRate;

      const { userId } = appointment;
      const seeker = await this.userService.findById(userId);

      if (seeker.balance < amountToPay) {
        throw new HttpException('Insufficient funds', HttpStatus.BAD_REQUEST);
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
      const appointment = await this.findAppointmentById(appointmentId);

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

      if (weeksDifference >= 1) {
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
      const appointment = await this.findAppointmentById(appointmentId);

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
}
