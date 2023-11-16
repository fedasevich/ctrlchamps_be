import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class OtpCodeVerifyDto {
  @ApiProperty({
    description: 'Otp code',
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
  code: string;
}
