import { ApiProperty } from '@nestjs/swagger';

import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';
import { Qualification } from 'src/common/enums/qualification.enum';

import { TimeSlotDto } from './time-slot.dto';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Array of qualifications',
    example: ['Personal Care Assistance', 'Medication Management'],
    required: false,
  })
  @IsOptional()
  services?: Qualification[];

  @ApiProperty({
    description: 'Available time slots for the user',
    type: [TimeSlotDto],
    example: [
      {
        day: 'Monday',
        timeZone: 'UTC-5',
        startTime: '09:00',
        endTime: '12:00',
      },
      {
        day: 'Tuesday',
        timeZone: 'UTC-6',
        startTime: '14:00',
        endTime: '18:00',
      },
    ],
  })
  @IsArray()
  @IsOptional()
  availability: TimeSlotDto[];

  @ApiProperty({ example: 25 })
  @IsOptional()
  @IsInt()
  hourlyRate: number;

  @ApiProperty({ example: 'I am an experienced nurse...' })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ example: 'https://youtube.com/user/video' })
  @IsOptional()
  @IsString()
  videoLink?: string;
}
