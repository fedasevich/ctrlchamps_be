import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';
import {
  PreferredDay,
  PreferredTime,
} from 'src/common/enums/preferred-time.enum';

export class TimeSlotDto {
  @ApiProperty({ description: 'Day of the week', example: 'Monday' })
  @IsNotEmpty()
  @IsString()
  day: PreferredDay;

  @ApiProperty({ description: 'Part of the day', example: 'Morning' })
  @IsNotEmpty()
  @IsString()
  partOfDay: PreferredTime;

  @ApiProperty({ description: 'Start time', example: '09:00' })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'End time', example: '12:00' })
  @IsNotEmpty()
  @IsString()
  endTime: string;
}
