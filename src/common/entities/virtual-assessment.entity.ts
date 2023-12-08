import { ApiProperty } from '@nestjs/swagger';

import { Appointment } from 'src/common/entities/appointment.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class VirtualAssessment {
  @ApiProperty({
    description: 'Unique identifier of the virtual assessment',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
    description:
      'Link to the appointment associated with the virtual assessment',
  })
  @OneToOne(() => Appointment, (appointment) => appointment.virtualAssessment)
  @JoinColumn()
  appointment: Appointment;
}
