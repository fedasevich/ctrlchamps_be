import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserCreateValidationRule } from 'modules/users/enums/user-create.validation-rule.enum';

export class UpdatePasswordDto {
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
