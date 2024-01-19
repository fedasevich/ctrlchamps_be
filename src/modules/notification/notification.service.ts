import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Notification } from 'src/common/entities/notification.entity';
import { NotificationMessage } from 'src/common/enums/notification-message.enum';
import { Repository } from 'typeorm';

import { NotificationsListResponse } from './types/notification.type';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async getNotifications(userId: string): Promise<NotificationsListResponse> {
    try {
      const notifications = await this.notificationRepository
        .createQueryBuilder('notification')
        .select([
          'notification.id AS id',
          'appointment.id AS appointmentId',
          'notification.message AS status',
          `CONCAT(sender.firstName, ' ', sender.lastName) AS user`,
        ])
        .innerJoin('notification.sender', 'sender')
        .innerJoin('notification.receiver', 'receiver')
        .innerJoin('notification.appointment', 'appointment')
        .where('receiver.id = :userId', { userId })
        .orderBy('notification.createdAt', 'DESC')
        .getRawMany();

      return { data: notifications, count: notifications.length };
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
    initiatorUserId?: string,
  ): Promise<void> {
    try {
      const newNotification = this.notificationRepository.create({
        message,
        sender: { id: initiatorUserId },
        receiver: { id: userId },
        appointment: { id: appointmentId },
      });

      await this.notificationRepository.save(newNotification);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create notification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
