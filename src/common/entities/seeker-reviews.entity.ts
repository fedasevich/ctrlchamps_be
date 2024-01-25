import { ApiProperty } from '@nestjs/swagger';

import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { User } from 'src/common/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['userId', 'caregiverInfoId'])
export class SeekerReview {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the review',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'The rating of the review.' })
  @Column({ type: 'integer' })
  rating: number;

  @ApiProperty({ description: 'The text of the review.', required: false })
  @Column({ type: 'varchar', length: 350, nullable: true })
  review?: string;

  @ApiProperty({ description: 'The date the review was created.' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
    description: 'Caregiver Info ID associated with the review',
  })
  @Column()
  caregiverInfoId: string;

  @ApiProperty({
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
    description: 'User ID associated with the review (seeker)',
  })
  @Column()
  userId: string;

  @ManyToOne(() => CaregiverInfo, (caregiver) => caregiver.seekerReviews)
  @JoinColumn({ name: 'caregiverInfoId' })
  caregiverInfo: CaregiverInfo;

  @ManyToOne(() => User, (seeker) => seeker.seekerReviews)
  @JoinColumn({ name: 'userId' })
  user: User;
}
