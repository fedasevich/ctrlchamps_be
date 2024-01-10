import { ApiProperty } from '@nestjs/swagger';

import { Appointment } from 'src/common/entities/appointment.entity';
import { Diagnosis } from 'src/common/entities/diagnosis.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity()
export class SeekerDiagnosis {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Appointment ID associated with the diagnosis',
  })
  @PrimaryColumn('uuid')
  appointmentId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Diagnosis ID associated with the appointment',
  })
  @PrimaryColumn('uuid')
  diagnosisId: string;

  @ManyToOne(() => Diagnosis, (diagnosis) => diagnosis.seekerDiagnoses)
  @JoinColumn({ name: 'diagnosisId' })
  diagnosis: Diagnosis;

  @ManyToOne(() => Appointment, (appointment) => appointment.seekerDiagnoses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;
}
