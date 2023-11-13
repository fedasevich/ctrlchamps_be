import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsNotEmpty, Matches, MaxLength } from 'class-validator';
import { UserCreateValidationMessage } from 'modules/users/enums/user-create.validation-message.enum';
import { UserCreateValidationRule } from 'modules/users/enums/user-create.validation-rule.enum';

export class AccountCheckDto {
  @ApiProperty({
    description: "User's email",
    example: 'user@gmail.com',
  })
  @IsEmail({}, { message: UserCreateValidationMessage.IncorrectEmail })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "User's phoneNumber",
    example: '+15551234567',
  })
  @IsNotEmpty()
  @MaxLength(UserCreateValidationRule.MaxPhoneNumberLength)
  @Matches(UserCreateValidationRule.PhoneNumberRegex)
  phoneNumber: string;
}
