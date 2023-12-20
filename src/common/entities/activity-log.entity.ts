import { ApiProperty } from '@nestjs/swagger';

import { Appointment } from 'src/common/entities/appointment.entity';
import { ActivityLogStatus } from 'src/modules/activity-log/enums/activity-log-status.enum';
import { Entity, PrimaryColumn, JoinColumn, OneToOne, Column } from 'typeorm';

@Entity()
export class ActivityLog {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the Appointment associated with the activity log',
  })
  @PrimaryColumn('uuid')
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

  @OneToOne(() => Appointment, (appointment) => appointment.activityLog)
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;
}
