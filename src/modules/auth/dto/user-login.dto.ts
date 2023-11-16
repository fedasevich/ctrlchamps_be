import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { UserCreateValidationMessage } from 'modules/users/enums/user-create.validation-message.enum';

export class UserLoginDto {
  @ApiProperty({
    description: "User's email",
    example: 'user@gmail.com',
  })
  @IsEmail({}, { message: UserCreateValidationMessage.IncorrectEmail })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "User's password",
    example: 'A234567!',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
