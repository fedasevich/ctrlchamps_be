import { ApiProperty } from '@nestjs/swagger';

import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  Matches,
  IsString,
  MinLength,
  IsOptional,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { Country } from 'modules/users/enums/country.enum';
import { UserCreateValidationMessage } from 'modules/users/enums/user-create.validation-message.enum';
import { UserCreateValidationRule } from 'modules/users/enums/user-create.validation-rule.enum';
import { UserRole } from 'modules/users/enums/user-role.enum';

export class AdminCreateDto {
  @ApiProperty({
    description: "Admin's email",
    example: 'admin@gmail.com',
  })
  @IsEmail({}, { message: UserCreateValidationMessage.IncorrectEmail })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "Admin's password",
    example: 'A234567!',
  })
  @MinLength(UserCreateValidationRule.MinPasswordLength)
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: "Admin's firstName",
    example: 'James',
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: "Admin's lastName",
    example: 'Bean',
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: "Admin's phoneNumber",
    example: '+15551234567',
  })
  @IsNotEmpty()
  @MaxLength(UserCreateValidationRule.MaxPhoneNumberLength)
  @Matches(UserCreateValidationRule.PhoneNumberRegex)
  phoneNumber: string;

  @ApiProperty({
    description: "Admin's role",
    example: 'Admin',
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: "Admin's dateOfBirth",
    example: null,
    required: false,
  })
  @IsOptional()
  @IsString()
  dateOfBirth: string;

  @ApiProperty({
    description: "Admin's country",
    example: null,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsEnum(Country)
  country: Country;

  @ApiProperty({
    description: "Admin's state",
    example: null,
    required: false,
  })
  @IsOptional()
  @IsString()
  state: string;

  @ApiProperty({
    description: "Admin's city",
    example: null,
    required: false,
  })
  @IsOptional()
  @IsString()
  city: string;

  @ApiProperty({
    description: "Admin's zipCode",
    example: null,
    required: false,
  })
  @IsOptional()
  @IsString()
  zipCode: string;

  @ApiProperty({
    description: "Admin's address",
    example: null,
    required: false,
  })
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Indicates whether the user account was verified via otp code',
    example: 'true',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isVerified: boolean;
}
