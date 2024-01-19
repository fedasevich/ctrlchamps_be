import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsOptional, Matches, MaxLength } from 'class-validator';
import { UserCreateValidationMessage } from 'modules/users/enums/user-create.validation-message.enum';
import { UserCreateValidationRule } from 'modules/users/enums/user-create.validation-rule.enum';

export class AccountCheckDto {
  @ApiProperty({
    description: "User's email",
    example: 'user@gmail.com',
    required: false,
  })
  @IsEmail({}, { message: UserCreateValidationMessage.IncorrectEmail })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: "User's phoneNumber",
    example: '+15551234567',
    required: false,
  })
  @IsOptional()
  @MaxLength(UserCreateValidationRule.MaxPhoneNumberLength)
  @Matches(UserCreateValidationRule.PhoneNumberRegex)
  phoneNumber?: string;
}
