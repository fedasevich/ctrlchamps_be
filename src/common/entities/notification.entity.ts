import { ApiProperty } from '@nestjs/swagger';

import { User } from 'src/common/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { NotificationMessage } from '../enums/notification-message.enum';

import { Appointment } from './appointment.entity';

@Entity()
export class Notification {
  @ApiProperty({
    description: 'Unique identifier for notification',
    example: 'e02769c5-60c7-4c88-8372-6c2598f9a234',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Notification message',
    example:
      'Caregiver accepted your request. You can schedule a Virtual Assessment now',
  })
  @Column({ type: 'enum', enum: NotificationMessage })
  message: NotificationMessage;

  @ApiProperty({
    description: 'Timestamp for when the notification was created',
    example: '2023-01-05T12:30:45.000Z',
  })
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    description: 'Identifies whether the user has read the notification',
    example: 'false',
  })
  @Column({ default: false })
  isRead: boolean;

  @ApiProperty({
    description: 'Link to the associated appointment',
    type: () => User,
  })
  @ManyToOne(() => Appointment, (appointment) => appointment.notification, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @ApiProperty({
    description: 'Link to the associated user',
    type: () => User,
  })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  @ApiProperty({
    description: 'Link to the initiator of notification',
    type: () => User,
    required: false,
  })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;
}
