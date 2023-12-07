import { ApiProperty } from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsDateString,
} from 'class-validator';

export class CreateVirtualAssessmentDto {
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
  @IsOptional()
  meetingLink?: string;

  @ApiProperty({
    description: 'ID of the appointment',
    example: 'f4312r0b-58ee-3172-a567-1f02b2c313d7',
  })
  @IsString()
  @IsNotEmpty()
  appointmentId: string;
}
