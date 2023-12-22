import { ApiProperty } from '@nestjs/swagger';

import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

import {
  REASON_MAX_LENGTH,
  REASON_MIN_LENGTH,
} from '../constants/virtual-assessment.constant';

export class RescheduleVirtualAssessmentDto {
  @ApiProperty({
    description: 'Reason for rescheduling',
    example: 'I have some unexpected circumstances',
  })
  @IsString()
  @IsNotEmpty()
  @Length(REASON_MIN_LENGTH, REASON_MAX_LENGTH, {
    message: `Reason length must contain at least ${REASON_MIN_LENGTH} characters, at most - ${REASON_MAX_LENGTH} `,
  })
  reason: string;

  @ApiProperty({
    description: 'Start time of the assessment',
    example: '15:00',
  })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'End time of the assessment',
    example: '16:30',
  })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    description: 'Date of the assessment',
    example: '2023-12-31',
  })
  @IsNotEmpty()
  @IsDateString()
  assessmentDate: Date;

  @ApiProperty({
    description: 'Link for the assessment meeting',
    example: 'https://meet.example.com/1234',
  })
  @IsUrl()
  @IsNotEmpty()
  meetingLink: string;
}
