import { ApiProperty } from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, {
    message: 'Password must contain a minimum of eight characters',
  })
  @ApiProperty()
  password: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(18)
  @ApiProperty()
  age: number;
}
