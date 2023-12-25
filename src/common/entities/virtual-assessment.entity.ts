import { ApiProperty } from '@nestjs/swagger';

import { Appointment } from 'src/common/entities/appointment.entity';
import { VirtualAssessmentStatus } from 'src/common/enums/virtual-assessment.enum';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class VirtualAssessment {
  @ApiProperty({
    description: 'Unique identifier of the virtual assessment',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Status of the virtual assessment',
    enum: VirtualAssessmentStatus,
    default: VirtualAssessmentStatus.Proposed,
  })
  @Column({
    type: 'enum',
    enum: VirtualAssessmentStatus,
    default: VirtualAssessmentStatus.Proposed,
  })
  status: VirtualAssessmentStatus;

  @ApiProperty({
    description: 'Start time of the virtual assessment',
  })
  @Column({ type: 'time' })
  startTime: string;

  @ApiProperty({
    description: 'End time of the virtual assessment',
  })
  @Column({ type: 'time' })
  endTime: string;

  @ApiProperty({
    description: 'Date of the virtual assessment',
  })
  @Column({ type: 'date' })
  assessmentDate: Date;

  @ApiProperty({
    description: 'Meeting link for the virtual assessment',
    nullable: true,
  })
  @Column({ nullable: true })
  meetingLink: string;

  @ApiProperty({
    description: 'Indication of virtual assessment rescheduling status',
    nullable: true,
  })
  @Column({ default: false })
  wasRescheduled: boolean;

  @ApiProperty({
    description: 'Indication of client accepting/rejecting the rescheduling',
    nullable: true,
  })
  @Column({ default: null })
  reschedulingAccepted: null | boolean;

  @ApiProperty({
    description:
      'Link to the appointment associated with the virtual assessment',
  })
  @OneToOne(() => Appointment, (appointment) => appointment.virtualAssessment)
  @JoinColumn()
  appointment: Appointment;
}
