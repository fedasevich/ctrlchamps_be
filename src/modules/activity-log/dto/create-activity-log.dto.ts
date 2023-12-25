import { ApiProperty } from '@nestjs/swagger';

import {
  IsUUID,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  IsString,
} from 'class-validator';
import { ActivityLogStatus } from 'src/modules/activity-log/enums/activity-log-status.enum';

export class CreateActivityLogDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the Appointment associated with the activity log',
  })
  @IsUUID()
  appointmentId: string;

  @ApiProperty({
    enum: ActivityLogStatus,
    description: 'Activity log status',
  })
  @IsEnum(ActivityLogStatus)
  status: ActivityLogStatus;

  @ApiProperty({
    example: ['Shopping grocery'],
    description: 'Selected tasks',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tasks: string[];
}
