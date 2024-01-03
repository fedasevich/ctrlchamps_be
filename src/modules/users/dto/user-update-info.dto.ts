import { ApiProperty } from '@nestjs/swagger';

import {
  IsEnum,
  Matches,
  IsString,
  IsBoolean,
  IsOptional,
  MaxLength,
  IsNumber,
} from 'class-validator';
import { Country } from 'modules/users/enums/country.enum';
import { UserCreateValidationRule } from 'modules/users/enums/user-create.validation-rule.enum';

export class UserUpdateDto {
  @ApiProperty({
    description: "User's firstName",
    example: 'Max',
    required: false,
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiProperty({
    description: "User's lastName",
    example: 'Volovo',
    required: false,
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiProperty({
    description: "User's phoneNumber",
    example: '+15551234567',
    required: false,
  })
  @MaxLength(UserCreateValidationRule.MaxPhoneNumberLength)
  @Matches(UserCreateValidationRule.PhoneNumberRegex)
  @IsOptional()
  phoneNumber: string;

  @ApiProperty({
    description: "User's dateOfBirth",
    example: '11/11/1960',
    required: false,
  })
  @IsString()
  @IsOptional()
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
    description: "User's country",
    example: 'USA',
    required: false,
  })
  @IsString()
  @IsEnum(Country)
  @IsOptional()
  country: Country;

  @ApiProperty({
    description: "User's state",
    example: 'Texas',
    required: false,
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsString()
  @IsOptional()
  state: string;

  @ApiProperty({
    description: "User's city",
    example: 'Dallas',
    required: false,
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty({
    description: "User's zipCode",
    example: '75201',
    required: false,
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsString()
  @IsOptional()
  zipCode: string;

  @ApiProperty({
    description: "User's address",
    example: '123 Maple Street',
    required: false,
  })
  @MaxLength(UserCreateValidationRule.MaxLength)
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty({
    description: 'Link of user`s avatar',
    example: 'https://images/avatar',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatar: string;

  @ApiProperty({
    description: "User's balance",
    example: 500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  balance: number;
}
