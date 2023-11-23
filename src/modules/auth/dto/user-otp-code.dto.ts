import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class UserOtpCodeDto {
  @ApiProperty({
    description: "User's otpCode",
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
  otpCode: string;
}
