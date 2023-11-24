import { ApiProperty } from '@nestjs/swagger';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import { PreferredDay, PreferredTime } from '../enums/preferred-time.enum';
import { Qualification } from '../enums/qualification.enum';

import { Certificate } from './certificate.entity';
import { User } from './user.entity';
import { WorkExperience } from './work-experience.entity';

interface TimeSlot {
  day: PreferredDay;
  partOfDay: PreferredTime;
  startTime: string;
  endTime: string;
}

@Entity()
export class UserAdditionalInfo {
  @ApiProperty({
    description: "User's Additional Info ID",
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User Certificates',
    example:
      '[{ id: "1e3a4c60", name: "Certificate 1" }, { id: "2a2b4c60", name: "Certificate 2" }]',
  })
  @OneToMany(
    () => Certificate,
    (certificate) => certificate.userAdditionalInfo,
    { cascade: true },
  )
  certificates: Certificate[];

  @ApiProperty({
    description: 'User Work Experiences',
    example:
      '[{ company: "Company 1", title: "Job Title" }, { company: "Company 2", title: "Job Title" }]',
  })
  @OneToMany(
    () => WorkExperience,
    (workExperience) => workExperience.userAdditionalInfo,
    { cascade: true },
  )
  workExperiences: WorkExperience[];

  @ApiProperty({
    description: 'Qualifications of the user',
    example:
      '[Qualification.PersonalCareAssistance, Qualification.MedicationManagement]',
  })
  @Column('json', { nullable: true })
  services: Qualification[];

  @ApiProperty({
    description: 'Available time slots for the user',
    example: [
      {
        day: 'Monday',
        partOfDay: 'Morning',
        startTime: '09:00',
        endTime: '12:00',
      },
      {
        day: 'Tuesday',
        partOfDay: 'Afternoon',
        startTime: '14:00',
        endTime: '18:00',
      },
    ],
  })
  @Column('json', { nullable: true })
  availability: TimeSlot[];

  @ApiProperty({
    description: 'Hourly rate for the user',
    example: 25,
  })
  @Column({ type: 'int', nullable: true })
  hourlyRate: number;

  @ApiProperty({
    description: 'Self-description of user',
    example:
      'I am an experienced nurse with 8 years of work in Central Hospital...',
  })
  @Column({ length: 100, nullable: true })
  description: string;

  @ApiProperty({
    description: 'Link to self-representing video',
    example: 'https://youtube.com/user/video',
  })
  @Column({ default: null, nullable: true })
  videoLink: string;

  @ApiProperty({
    description: 'Link to the user',
  })
  @OneToOne(() => User, (user) => user.additionalInfo, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;
}
