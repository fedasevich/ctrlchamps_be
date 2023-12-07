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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'date' })
  assessmentDate: Date;

  @Column({ nullable: true })
  meetingLink: string;

  @ApiProperty({
    description: 'Link to the user',
  })
  @OneToOne(() => Appointment, (appointment) => appointment.virtualAssessment)
  @JoinColumn()
  appointment: Appointment;
}
