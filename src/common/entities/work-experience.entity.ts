import { ApiProperty } from '@nestjs/swagger';

import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { TypeOfWork } from 'src/common/enums/work-type.enum';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class WorkExperience {
  @ApiProperty({
    description: 'Unique identifier for work experience',
    example: 'e02769c5-60c7-4c88-8372-6c2598f9a234',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Name of the workplace',
    example: 'ABC Hospital',
  })
  @Column({ length: 100 })
  workplace: string;

  @ApiProperty({
    description: 'Type of work qualifications',
    example: 'Hospital',
    enum: TypeOfWork,
  })
  @Column({
    type: 'enum',
    enum: TypeOfWork,
  })
  qualifications: TypeOfWork[];

  @ApiProperty({
    description: 'Start date of work experience',
    example: '11/11/2020',
  })
  @Column()
  startDate: string;

  @ApiProperty({
    description: 'End date of work experience',
    example: '11/11/2020',
  })
  @Column()
  endDate: string;

  @ApiProperty({
    description: "Link to the user caregiver's information",
  })
  @ManyToOne(
    () => CaregiverInfo,
    (caregiverInfo) => caregiverInfo.workExperiences,
  )
  caregiverInfo: CaregiverInfo;
}
