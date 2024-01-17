import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ActivityLogStatus } from '../enums/activity-log-status.enum';

export class UpdateActivityLogDto {
  @ApiProperty({
    description: 'Status of the virtual assessment',
    enum: ActivityLogStatus,
  })
  @IsEnum(ActivityLogStatus)
  @IsNotEmpty()
  status: ActivityLogStatus;

  @ApiProperty({
    description: 'Reason for the rejected status',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  reason?: string;
}
