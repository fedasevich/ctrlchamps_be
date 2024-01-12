import { ApiProperty } from '@nestjs/swagger';

import {
  IsEnum,
  Matches,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { UserCreateValidationRule } from 'modules/users/enums/user-create.validation-rule.enum';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

export class AdminUpdateDto {
  @ApiProperty({
    description: "Admin's firstName",
    example: 'James',
    required: false,
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsOptional()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: "Admin's lastName",
    example: 'Bean',
    required: false,
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: "Admin's phoneNumber",
    example: '+15551234567',
    required: false,
  })
  @IsOptional()
  @MaxLength(UserCreateValidationRule.MaxPhoneNumberLength)
  @Matches(UserCreateValidationRule.PhoneNumberRegex)
  phoneNumber: string;

  @ApiProperty({
    description: "Admin's role",
    example: 'Admin',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsEnum(UserRole)
  role: UserRole;
}
