import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OtpCode } from 'common/entities/otp-code.entity';

import { OtpCodeService } from './otp-code.service';

@Module({
  imports: [TypeOrmModule.forFeature([OtpCode])],
  providers: [OtpCodeService],
  exports: [OtpCodeService],
})
export class OtpCodeModule {}
