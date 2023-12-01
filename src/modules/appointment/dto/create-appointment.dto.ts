import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsDate,
  IsArray,
  IsUUID,
  IsNotEmpty,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { ActivityAnswer } from 'src/modules/appointment/enums/activity-answer.enum';
import { AppointmentCreateValidationRule } from 'src/modules/appointment/enums/appointment-create.validation-rule.enum';
import { AppointmentStatus } from 'src/modules/appointment/enums/appointment-status.enum';
import { AppointmentType } from 'src/modules/appointment/enums/appointment-type.enum';
import { Weekday } from 'src/modules/appointment/enums/weekday.enum';
import { SeekerActivityDto } from 'src/modules/seeker-activity/dto/seeker-activity.dto';

export class CreateAppointmentDto {
  @ApiProperty({
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
    description: 'Caregiver Info ID associated with the appointment',
  })
  @IsNotEmpty()
  @IsUUID()
  caregiverInfoId: string;

  @ApiProperty({
    example: 'Urgent Appointment',
    description: 'Name of the appointment',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(AppointmentCreateValidationRule.NameMaxLength)
  name: string;

  @ApiProperty({
    enum: AppointmentType,
    description: 'Type of the appointment',
  })
  @IsNotEmpty()
  @IsEnum(AppointmentType)
  type: AppointmentType;

  @ApiProperty({
    enum: AppointmentStatus,
    description: 'Current status of the appointment',
  })
  @IsNotEmpty()
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiProperty({
    example: 'Details about the appointment',
    description: 'Additional details of the appointment',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(AppointmentCreateValidationRule.DetailsMaxLength)
  details?: string;

  @ApiProperty({
    example: 'Location Address',
    description: 'Location of the appointment',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    example: 'Activity notes',
    description: 'Notes about the activity',
    required: false,
  })
  @IsOptional()
  @IsString()
  activityNote?: string;

  @ApiProperty({
    example: 'Diagnosis notes',
    description: 'Notes about the diagnosis',
    required: false,
  })
  @IsOptional()
  @IsString()
  diagnosisNote?: string;

  @ApiProperty({
    example: 'Capability notes',
    description: 'Notes about the capability',
    required: false,
  })
  @IsOptional()
  @IsString()
  capabilityNote?: string;

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
    example: 'Europe/Kiev',
    description: 'Timezone of the seeker',
  })
  @IsString()
  @IsNotEmpty()
  timezone: string;

  @ApiProperty({
    example: ['Monday', 'Wednesday'],
    description: 'Weekdays of the appointment',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Weekday, { each: true })
  weekdays?: string[];

  @ApiProperty({
    example: ['Sort mails', 'Clean the house'],
    description: 'Seeker tasks for caregiver',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(AppointmentCreateValidationRule.TaskNameMaxLength, { each: true })
  seekerTasks?: string[];

  @ApiProperty({
    example: ['1e3a4c60-94aa-45de-aad0-7b4a49017b1f'],
    description: 'Capabilities of seeker',
  })
  @IsArray()
  @IsString({ each: true })
  seekerCapabilities: string[];

  @ApiProperty({
    example: ['1e3a4c60-94aa-45de-aad0-7b4a49017b1f'],
    description: 'Seeker diagnoses',
  })
  @IsArray()
  @IsString({ each: true })
  seekerDiagnoses: string[];

  @ApiProperty({
    example: [
      {
        id: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
        answer: ActivityAnswer.AccomplishesAlone,
      },
    ],
    description: 'Seeker activities',
    type: [SeekerActivityDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeekerActivityDto)
  seekerActivities: SeekerActivityDto[];
}
