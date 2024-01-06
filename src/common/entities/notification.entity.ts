import { ApiProperty } from '@nestjs/swagger';

import { User } from 'src/common/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

import { NotificationMessage } from '../enums/notification-message.enum';

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
    description: 'Link to the associated user',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.notification)
  user: User;
}
