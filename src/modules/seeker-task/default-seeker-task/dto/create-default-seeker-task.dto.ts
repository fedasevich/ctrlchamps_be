import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { DefaultSeekerTaskValidationRule } from '../enums/default-seeker-task-create.validation-rule.enum';

export class CreateDefaultSeekerTaskDto {
  @ApiProperty({
    description: "Default seeker task's name",
    example: 'Go for a walk',
  })
  @MaxLength(DefaultSeekerTaskValidationRule.MaxLength)
  @MinLength(DefaultSeekerTaskValidationRule.MinLength)
  @IsNotEmpty()
  @IsString()
  name: string;
}
