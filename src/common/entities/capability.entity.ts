import { ApiProperty } from '@nestjs/swagger';

import { SeekerCapability } from 'src/common/entities/seeker-capability.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class Capability {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the capability',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Climbing Stairs',
    description: 'Name of the capability',
  })
  @Column()
  name: string;

  @OneToMany(
    () => SeekerCapability,
    (seekerCapability) => seekerCapability.capability,
  )
  seekerCapabilities: SeekerCapability[];
}
