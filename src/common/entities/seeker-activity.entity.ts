import { ApiProperty } from '@nestjs/swagger';

import { Activity } from 'src/common/entities/activity.entity';
import { Appointment } from 'src/common/entities/appointment.entity';
import { ActivityAnswer } from 'src/modules/seeker-activity/enums/activity-answer.enum';
import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class SeekerActivity {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the Appointment associated with the activity',
  })
  @PrimaryColumn('uuid')
  appointmentId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the Activity associated with the appointment',
  })
  @PrimaryColumn('uuid')
  activityId: string;

  @ApiProperty({
    enum: ActivityAnswer,
    enumName: 'ActivityAnswer',
    description: 'Answer for the activity',
  })
  @Column({
    type: 'enum',
    enum: ActivityAnswer,
  })
  answer: ActivityAnswer;

  @ManyToOne(() => Appointment, (appointment) => appointment.seekerActivities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @ManyToOne(() => Activity, (activity) => activity.seekerActivities)
  @JoinColumn({ name: 'activityId' })
  activity: Activity;
}
