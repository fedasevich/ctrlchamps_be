import { ApiProperty } from '@nestjs/swagger';

import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Weekday } from 'src/modules/appointment/enums/weekday.enum';

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
    example: '2023-11-28T15:30:00.000Z',
    description: 'Start date of the appointment',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({
    example: '2023-11-28T15:30:00.000Z',
    description: 'End date of the appointment',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({
    example: ['Monday', 'Wednesday'],
    description: 'Weekdays of the appointment seeker has chosen',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Weekday, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : Array(value)))
  weekdays?: string[];

  @ApiProperty({
    description: 'Ratings',
    example: [1, 2, 3, 4],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map(Number) : [Number(value)],
  )
  ratings?: number[];
}
