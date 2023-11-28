import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';
import { PreferredDay } from 'src/common/enums/preferred-time.enum';

export class TimeSlotDto {
  @ApiProperty({ description: 'Day of the week', example: 'Monday' })
  @IsNotEmpty()
  @IsString()
  day: PreferredDay;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Caregiver's time zone`, example: 'UTC-3' })
  timeZone: string;

  @ApiProperty({ description: 'Start time', example: '09:00' })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'End time', example: '12:00' })
  @IsNotEmpty()
  @IsString()
  endTime: string;
}
