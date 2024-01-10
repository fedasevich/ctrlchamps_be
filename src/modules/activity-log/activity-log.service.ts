import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ActivityLog } from 'src/common/entities/activity-log.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { NotificationMessage } from 'src/common/enums/notification-message.enum';
import { Repository } from 'typeorm';

import { NotificationService } from '../notification/notification.service';

import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';
import { ActivityLogStatus } from './enums/activity-log-status.enum';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly notificationService: NotificationService,
  ) {}

  async getActivityLogById(activityLogId: string): Promise<ActivityLog> {
    try {
      const activityLog = await this.activityLogRepository
        .createQueryBuilder('activityLog')
        .innerJoinAndSelect('activityLog.appointment', 'appointment')
        .innerJoinAndSelect('appointment.caregiverInfo', 'caregiverInfo')
        .innerJoinAndSelect('caregiverInfo.user', 'user')
        .where('activityLog.id = :id', { id: activityLogId })
        .getOne();

      if (!activityLog) {
        throw new HttpException(
          ErrorMessage.ActivityLogNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      return activityLog;
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

  async create(activityLog: CreateActivityLogDto): Promise<void> {
    try {
      const { tasks, ...rest } = activityLog;

      await this.activityLogRepository
        .createQueryBuilder()
        .insert()
        .into(ActivityLog)
        .values({
          ...rest,
          tasks: JSON.stringify(tasks),
        })
        .execute();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedCreateActivityLog,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateStatusActivityLog(
    activityLogId: string,
    updateActivityLogDto: UpdateActivityLogDto,
  ): Promise<void> {
    try {
      await this.activityLogRepository.update(
        { id: activityLogId },
        { status: updateActivityLogDto.status },
      );

      const activityLog = await this.getActivityLogById(activityLogId);

      if (updateActivityLogDto.status === ActivityLogStatus.Approved) {
        await this.notificationService.createNotification(
          activityLog.appointment.caregiverInfo.user.id,
          activityLog.appointment.id,
          NotificationMessage.ActivityLogApproved,
          activityLog.appointment.userId,
        );
      } else if (updateActivityLogDto.status === ActivityLogStatus.Rejected) {
        await this.notificationService.createNotification(
          activityLog.appointment.caregiverInfo.user.id,
          activityLog.appointment.id,
          NotificationMessage.ActivityLogRejected,
          activityLog.appointment.userId,
        );
      } else if (updateActivityLogDto.status === ActivityLogStatus.Pending) {
        await this.notificationService.createNotification(
          activityLog.appointment.userId,
          activityLog.appointment.id,
          NotificationMessage.ActivityLogReview,
          activityLog.appointment.caregiverInfo.user.id,
        );
      }
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedUpdateActivityLogStatus,
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
