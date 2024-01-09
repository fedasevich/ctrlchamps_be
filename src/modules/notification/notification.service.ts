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
    const notifications = await this.notificationRepository
      .createQueryBuilder('notifications')
      .innerJoin('notifications.user', 'user')
      .innerJoin('notifications.appointment', 'appointment')
      .select([
        'notifications.id AS id',
        'notifications.message AS status',
        'user.id AS userId',
        'appointment.id AS appointmentId',
      ])
      .where('user.id = :userId', { userId })
      .orderBy('notifications.createdAt', 'DESC')
      .getRawMany();

    return notifications;
  }

  async createNotification(
    userId: string,
    message: NotificationMessage,
  ): Promise<void> {
    try {
      await this.notificationRepository.save({
        message,
        user: { id: userId },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
