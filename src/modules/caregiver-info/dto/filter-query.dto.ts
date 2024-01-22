import { ApiProperty } from '@nestjs/swagger';

import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class FilterQueryDto {
  @ApiProperty({
    description: 'Is caregiver open to seeker home living',
    example: 'true',
  })
  @IsBoolean()
  @Type(() => Boolean)
  isOpenToSeekerHomeLiving: boolean;

  @ApiProperty({
    description: 'Is show availible caregivers',
    example: 'true',
  })
  @IsBoolean()
  @Type(() => Boolean)
  isShowAvailableCaregivers: boolean;

  @ApiProperty({
    description: 'Country name',
    example: 'United States',
  })
  @IsString()
  country: string;

  @ApiProperty({
    description: 'City name',
    example: 'Compton',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Address',
    example: 'South Alameda Street East',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'State name',
    example: 'California',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'Zip Code',
    example: '90221',
  })
  @IsString()
  zipCode: string;

  @ApiProperty({
    description: 'UTC Offset',
    example: -480,
  })
  @Type(() => Number)
  utcOffset: number;

  @ApiProperty({
    description: 'Services',
    example: [
      'Personal Care Assistance',
      'Medication Management',
      'Mobility Support',
      'Meal Preparation',
      'Housekeeping and Laundry',
      'Social and Recreational Activities',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : Array(value)))
  services?: string[];

  @ApiProperty({
    description: 'Start time',
    example: '2021-06-01T00:00:00.000Z',
  })
  @IsString()
  startTime: string;

  @ApiProperty({
    description: 'End time',
    example: '2021-06-01T00:00:00.000Z',
  })
  @IsString()
  endTime: string;
}
