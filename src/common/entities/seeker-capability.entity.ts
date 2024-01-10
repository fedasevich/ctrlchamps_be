import { ApiProperty } from '@nestjs/swagger';

import { Appointment } from 'src/common/entities/appointment.entity';
import { Capability } from 'src/common/entities/capability.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity()
export class SeekerCapability {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the Appointment associated with the capability',
  })
  @PrimaryColumn('uuid')
  appointmentId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the Capability associated with the appointment',
  })
  @PrimaryColumn('uuid')
  capabilityId: string;

  @ManyToOne(
    () => Appointment,
    (appointment) => appointment.seekerCapabilities,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @ManyToOne(() => Capability, (capability) => capability.seekerCapabilities)
  @JoinColumn({ name: 'capabilityId' })
  capability: Capability;
}
