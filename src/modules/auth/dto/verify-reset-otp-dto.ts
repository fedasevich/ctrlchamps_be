import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UserCreateValidationMessage } from 'modules/users/enums/user-create.validation-message.enum';
import { UserCreateValidationRule } from 'modules/users/enums/user-create.validation-rule.enum';

export class VerifyResetOtpDto {
  @ApiProperty({
    description: "User's email",
    example: 'user@gmail.com',
  })
  @IsEmail({}, { message: UserCreateValidationMessage.IncorrectEmail })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Otp code',
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
  code: string;
}
