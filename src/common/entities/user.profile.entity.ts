import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import { PreferredTime } from '../enums/preferred-time.enum';
import { Qualification } from '../enums/qualification.enum';

import { Certificate } from './certificate.entity';
import { WorkExperience } from './experience.entity';
import { User } from './user.entity';

@Entity()
export class UserAdditionalInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(
    () => Certificate,
    (certificate) => certificate.userAdditionalInfo,
    { cascade: true },
  )
  certificates: Certificate[];

  @OneToMany(
    () => WorkExperience,
    (workExperience) => workExperience.userAdditionalInfo,
    { cascade: true },
  )
  workExperiences: WorkExperience[];

  @Column({
    type: 'enum',
    enum: Qualification,
  })
  qualifications: Qualification[];

  @Column({
    type: 'enum',
    enum: PreferredTime,
  })
  preferredTime: PreferredTime[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hourlyRate: number;

  @Column({ length: 100 })
  description: string;

  @Column({ default: null, nullable: true })
  videoLink: string;

  @OneToOne(() => User, (user) => user.additionalInfo, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;
}
