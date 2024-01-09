import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Notification } from 'src/common/entities/notification.entity';
import { NotificationMessage } from 'src/common/enums/notification-message.enum';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const notifications = await this.notificationRepository
        .createQueryBuilder('notifications')
        .innerJoin('notifications.user', 'user')
        .innerJoin('notifications.appointment', 'appointment')
        .select([
          'notifications.id AS id',
          'notifications.message AS status',
          'appointment.id AS appointmentId',
          `CONCAT(user.firstName, ' ', user.lastName) AS user`,
        ])
        .where('user.id = :userId', { userId })
        .orderBy('notifications.createdAt', 'DESC')
        .getRawMany();

      return notifications;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public async createNotification(
    userId: string,
    appointmentId: string,
    message: NotificationMessage,
  ): Promise<void> {
    try {
      await this.notificationRepository.save({
        message,
        user: { id: userId },
        appointment: { id: appointmentId },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
