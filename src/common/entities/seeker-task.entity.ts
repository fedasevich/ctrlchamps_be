import { ApiProperty } from '@nestjs/swagger';

import { Appointment } from 'src/common/entities/appointment.entity';
import { Entity, PrimaryColumn, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class SeekerTask {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the Appointment associated with the task',
  })
  @PrimaryColumn('uuid')
  appointmentId: string;

  @ApiProperty({ example: 'Grocery Shopping', description: 'Name of the task' })
  @PrimaryColumn()
  name: string;

  @ManyToOne(() => Appointment, (appointment) => appointment.seekerTasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;
}
