import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserCreateValidationRule } from 'src/modules/users/enums/user-create.validation-rule.enum';

export class PasswordUpdateDto {
  @ApiProperty({
    description: "Admin's password",
    example: 'A234567!',
  })
  @MinLength(UserCreateValidationRule.MinPasswordLength)
  @IsNotEmpty()
  @IsString()
  password: string;
}
