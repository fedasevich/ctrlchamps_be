import { ApiProperty } from '@nestjs/swagger';

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DefaultSeekerTask {
  @ApiProperty({
    description: 'Default seeker task id',
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Assist with grocery shopping',
    description: 'Name of the default seeker task',
  })
  @Column()
  name: string;
}
