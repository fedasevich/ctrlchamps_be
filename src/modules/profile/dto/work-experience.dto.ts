import { ApiProperty } from '@nestjs/swagger';

import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { TypeOfWork } from 'src/common/enums/work-type.enum';

export class WorkExperienceDto {
  @ApiProperty({
    description: 'Name of the workplace',
    example: 'ABC Hospital',
  })
  @IsNotEmpty()
  @IsString()
  workplace: string;

  @ApiProperty({
    description: 'Type of work qualifications',
    example: 'Clinic',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(TypeOfWork, { each: true })
  qualifications: TypeOfWork[];

  @ApiProperty({
    description: 'Start date of work experience',
    example: '2020-11-11',
  })
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @ApiProperty({
    description: 'End date of work experience',
    example: '2021-11-11',
  })
  @Transform(({ value }) => (value ? new Date(value) : null))
  endDate: Date | null;
}
