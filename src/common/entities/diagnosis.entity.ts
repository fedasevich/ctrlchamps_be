import { ApiProperty } from '@nestjs/swagger';

import { SeekerDiagnosis } from 'src/common/entities/seeker-diagnosis.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class Diagnosis {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the diagnosis',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Diabetes', description: 'Name of the diagnosis' })
  @Column()
  name: string;

  @OneToMany(
    () => SeekerDiagnosis,
    (seekerDiagnosis) => seekerDiagnosis.diagnosis,
  )
  seekerDiagnoses: SeekerDiagnosis[];
}
