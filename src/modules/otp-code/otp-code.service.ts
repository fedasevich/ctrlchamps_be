import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { OtpCode } from 'src/common/entities/otp-code.entity';
import { Repository } from 'typeorm';

import { OtpErrorMessage } from './enums/otp-error-message.enum';
import { OtpPurpose } from './enums/otp-purpose.enum';
import { generateOtpCode } from './helpers/generate-otp-code.helper';

@Injectable()
export class OtpCodeService {
  constructor(
    @InjectRepository(OtpCode)
    private readonly otpCodeRepository: Repository<OtpCode>,
  ) {}

  async createOtpCode(userId: string, purpose: OtpPurpose): Promise<string> {
    try {
      const generatedOtpCode = generateOtpCode();

      const existingOtpCode = await this.otpCodeRepository.findOne({
        where: { userId, purpose },
      });

      if (existingOtpCode) {
        existingOtpCode.code = generatedOtpCode;
        await this.otpCodeRepository.save(existingOtpCode);

        return existingOtpCode.code;
      }

      const otpCode = this.otpCodeRepository.create({
        userId,
        code: generatedOtpCode,
        purpose,
      });

      await this.otpCodeRepository.save(otpCode);

      return otpCode.code;
    } catch (error) {
      throw new HttpException(
        OtpErrorMessage.FailedCreateOtp,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyOtpCode(
    userId: string,
    purpose: OtpPurpose,
    code: string,
  ): Promise<boolean> {
    try {
      const otpCode = await this.otpCodeRepository.findOne({
        where: { userId, purpose, code },
      });

      if (!otpCode) {
        return false;
      }

      await this.otpCodeRepository.remove(otpCode);

      return true;
    } catch (error) {
      throw new HttpException(
        OtpErrorMessage.FailedVerifyOtp,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
