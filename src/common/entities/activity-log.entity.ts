import { ApiProperty } from '@nestjs/swagger';

import { Appointment } from 'src/common/entities/appointment.entity';
import { ActivityLogStatus } from 'src/modules/activity-log/enums/activity-log-status.enum';
import {
  Entity,
  JoinColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ActivityLog {
  @ApiProperty({
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
    description: 'ID of the activity log',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the Appointment associated with the activity log',
  })
  @Column('uuid')
  appointmentId: string;

  @ApiProperty({
    enum: ActivityLogStatus,
    description: 'Activity log status',
  })
  @Column({
    type: 'enum',
    enum: ActivityLogStatus,
  })
  status: ActivityLogStatus;

  @ApiProperty({ example: ['Shopping grocery'], description: 'Selected tasks' })
  @Column('json')
  tasks: string;

  @ApiProperty({
    example: ['Shopping grocery'],
    description: 'Activity log date',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Appointment, (appointment) => appointment.activityLog)
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;
}
