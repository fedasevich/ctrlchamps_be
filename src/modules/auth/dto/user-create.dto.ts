import { ApiProperty } from '@nestjs/swagger';

import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  Matches,
  IsString,
  MinLength,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Country } from 'modules/users/enums/country.enum';
import { UserCreateValidationMessage } from 'modules/users/enums/user-create.validation-message.enum';
import { UserCreateValidationRule } from 'modules/users/enums/user-create.validation-rule.enum';
import { UserRole } from 'modules/users/enums/user-role.enum';

export class UserCreateDto {
  @ApiProperty({
    description: "User's email",
    example: 'user@gmail.com',
  })
  @IsEmail({}, { message: UserCreateValidationMessage.IncorrectEmail })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "User's password",
    example: 'A234567!',
  })
  @MinLength(UserCreateValidationRule.MinPasswordLength)
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: "User's firstName",
    example: 'Max',
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: "User's lastName",
    example: 'Volovo',
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: "User's phoneNumber",
    example: '+15551234567',
  })
  @IsNotEmpty()
  @MaxLength(UserCreateValidationRule.MaxPhoneNumberLength)
  @Matches(UserCreateValidationRule.PhoneNumberRegex)
  phoneNumber: string;

  @ApiProperty({
    description: "User's dateOfBirth",
    example: '11/11/1960',
  })
  @IsNotEmpty()
  @IsString()
  dateOfBirth: string;

  @ApiProperty({
    description:
      "Indicates whether the user is open to living in a seeker's home",
    example: 'true',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isOpenToSeekerHomeLiving?: boolean | null;

  @ApiProperty({
    description: "User's role",
    example: 'Caregiver',
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: "User's country",
    example: 'USA',
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(Country)
  country: Country;

  @ApiProperty({
    description: "User's state",
    example: 'Texas',
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({
    description: "User's city",
    example: 'Dallas',
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    description: "User's zipCode",
    example: '75201',
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsNotEmpty()
  @IsString()
  zipCode: string;

  @ApiProperty({
    description: "User's address",
    example: '123 Maple Street',
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsNotEmpty()
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
