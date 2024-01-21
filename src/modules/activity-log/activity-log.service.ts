import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { ActivityLog } from 'src/common/entities/activity-log.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { NotificationMessage } from 'src/common/enums/notification-message.enum';
import { Repository } from 'typeorm';

import { AdminPanelService } from '../admin-panel/admin-panel.service';
import { EmailService } from '../email/services/email.service';
import { NotificationService } from '../notification/notification.service';

import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';
import { ActivityLogStatus } from './enums/activity-log-status.enum';

@Injectable()
export class ActivityLogService {
  private readonly allAdminsRejectedActivityLogTemplateId =
    this.configService.get<string>(
      'SENDGRID_ALL_ADMINS_REJECTED_ACTIVITY_LOG_TEMPLATE_ID',
    );

  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly notificationService: NotificationService,
    private readonly adminPanelService: AdminPanelService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async getActivityLogById(activityLogId: string): Promise<ActivityLog> {
    try {
      const activityLog = await this.activityLogRepository
        .createQueryBuilder('activityLog')
        .innerJoinAndSelect('activityLog.appointment', 'appointment')
        .innerJoinAndSelect('appointment.caregiverInfo', 'caregiverInfo')
        .innerJoinAndSelect('appointment.user', 'seeker')
        .innerJoinAndSelect('caregiverInfo.user', 'caregiver')
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

      let notificationMessage: NotificationMessage;

      switch (updateActivityLogDto.status) {
        case ActivityLogStatus.Approved:
          notificationMessage = NotificationMessage.ActivityLogApproved;
          break;
        case ActivityLogStatus.Rejected:
          notificationMessage = NotificationMessage.ActivityLogRejected;
          break;
        case ActivityLogStatus.Pending:
          notificationMessage = NotificationMessage.ActivityLogReview;
          break;
        default:
          break;
      }

      if (notificationMessage) {
        await this.notificationService.createNotification(
          updateActivityLogDto.status === ActivityLogStatus.Pending
            ? activityLog.appointment.userId
            : activityLog.appointment.caregiverInfo.user.id,
          activityLog.appointment.id,
          notificationMessage,
          updateActivityLogDto.status === ActivityLogStatus.Pending
            ? activityLog.appointment.caregiverInfo.user.id
            : activityLog.appointment.userId,
        );
      }

      if (
        updateActivityLogDto.reason &&
        updateActivityLogDto.status === ActivityLogStatus.Rejected
      ) {
        const admins = await this.adminPanelService.getAllAdmins();

        await this.emailService.sendEmail({
          to: admins.map((admin) => admin.email),
          templateId: this.allAdminsRejectedActivityLogTemplateId,
          dynamicTemplateData: {
            seekerName: `${activityLog.appointment.user.firstName} ${activityLog.appointment.user.lastName}`,
            caregiverName: `${activityLog.appointment.caregiverInfo.user.firstName} ${activityLog.appointment.caregiverInfo.user.lastName}`,
            appointmentId: activityLog.appointment.id,
            reason: updateActivityLogDto.reason,
          },
        });
      }
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedUpdateActivityLogStatus,
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
