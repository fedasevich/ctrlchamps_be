import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString, IsDateString, IsEnum } from 'class-validator';
import { TypeOfWork } from 'src/common/enums/work-type.enum';

export class CreateWorkExperienceDto {
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
  @IsEnum(TypeOfWork)
  qualifications: TypeOfWork[];

  @ApiProperty({
    description: 'Start date of work experience',
    example: '2020-11-11',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date of work experience',
    example: '2021-11-11',
  })
  @IsDateString()
  endDate: string;
}
