import { ApiProperty } from '@nestjs/swagger';

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserCreateValidationMessage } from 'modules/users/enums/user-create.validation-message.enum';
import { UserCreateValidationRule } from 'modules/users/enums/user-create.validation-rule.enum';

export class UpdatePasswordDto {
  @ApiProperty({
    description: "User's email",
    example: 'user@gmail.com',
  })
  @IsEmail({}, { message: UserCreateValidationMessage.IncorrectEmail })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Old user password',
    example: '1234445534',
  })
  @MinLength(UserCreateValidationRule.MinPasswordLength)
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'New user password',
    example: '2342435532',
  })
  @MinLength(UserCreateValidationRule.MinPasswordLength)
  @IsNotEmpty()
  @IsString()
  newPassword: string;
}
