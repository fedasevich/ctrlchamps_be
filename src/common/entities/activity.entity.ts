import { ApiProperty } from '@nestjs/swagger';

import { SeekerActivity } from 'src/common/entities/seeker-activity.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class Activity {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the activity',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Walking', description: 'Name of the activity' })
  @Column()
  name: string;

  @OneToMany(() => SeekerActivity, (seekerActivity) => seekerActivity.activity)
  seekerActivities: SeekerActivity[];
}
