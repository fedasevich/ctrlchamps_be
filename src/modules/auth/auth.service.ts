import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { compare, hash } from 'bcrypt';
import { ErrorMessage } from 'common/enums/error-message.enum';
import { EmailService } from 'modules/email/services/email.service';
import { OtpCodeVerifyDto } from 'modules/otp-code/dto/otp-code-verify.dto';
import { OtpPurpose } from 'modules/otp-code/enums/otp-purpose.enum';
import { OtpCodeService } from 'modules/otp-code/otp-code.service';
import { UserService } from 'modules/users/user.service';

import { ResetOtpDto } from '../otp-code/dto/reset-otp.dto';
import { VerifyResetOtpDto } from '../otp-code/dto/verify-reset-otp-dto';

import { AccountCheckDto } from './dto/account-check.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserCreateDto } from './dto/user-create.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { Token } from './types/token.type';

@Injectable()
export class AuthService {
  private readonly saltRounds = this.configService.get<number>(
    'PASSWORD_SALT_ROUNDS',
  );

  private readonly otpCodeTemplateId = this.configService.get<string>(
    'SENDGRID_OTP_TEMPLATE_ID',
  );

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly otpCodeService: OtpCodeService,
  ) {}

  async signUp(userDto: UserCreateDto): Promise<Token> {
    try {
      await this.accountCheck({
        email: userDto.email,
        phoneNumber: userDto.phoneNumber,
      });

      const passwordHash = await this.hashPassword(userDto.password);

      const id = await this.userService.create({
        ...userDto,
        password: passwordHash,
      });

      await this.sendOtpCodeEmail(
        id,
        userDto.email,
        OtpPurpose.ACCOUNT_VERIFICATION,
      );

      const token = await this.createToken(id);

      return {
        token,
      };
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async signIn(dto: UserLoginDto): Promise<Token> {
    try {
      const user = await this.userService.findByEmailOrPhoneNumber(dto.email);
      const validPassword =
        user && (await compare(dto.password, user.password));
      if (!user || !validPassword) {
        throw new HttpException(
          ErrorMessage.BadLoginCredentials,
          HttpStatus.UNAUTHORIZED,
        );
      }

      return {
        token: await this.createToken(user.id),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      return await hash(password, Number(this.saltRounds));
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedHashPassword,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async requestNewVerificationCode(userId: string): Promise<void> {
    try {
      const user = await this.userService.findById(userId);

      if (!user) {
        throw new HttpException(
          ErrorMessage.UserNotExist,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (user.isVerified) {
        throw new HttpException(
          ErrorMessage.UserAlreadyVerified,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.sendOtpCodeEmail(
        user.id,
        user.email,
        OtpPurpose.ACCOUNT_VERIFICATION,
      );
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyAccount(
    userId: string,
    otpCodeVerifyDto: OtpCodeVerifyDto,
  ): Promise<boolean> {
    try {
      const otpCodeVerificationResult = await this.otpCodeService.verifyOtpCode(
        userId,
        OtpPurpose.ACCOUNT_VERIFICATION,
        otpCodeVerifyDto.code,
      );

      if (!otpCodeVerificationResult) {
        throw new HttpException(
          ErrorMessage.VerificationCodeIncorrect,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.userService.verifyAccount(userId);

      return otpCodeVerificationResult;
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async sendOtpCodeEmail(
    userId: string,
    email: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    try {
      const otpAccountVerificationCode =
        await this.otpCodeService.createOtpCode(userId, purpose);

      await this.emailService.sendEmail({
        to: email,
        templateId: this.otpCodeTemplateId,
        dynamicTemplateData: { otpCode: otpAccountVerificationCode },
      });
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedSendVerificationCode,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async createToken(userId: string): Promise<string> {
    try {
      return this.jwtService.sign({ id: userId });
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedCreateToken,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async accountCheck(userDto: AccountCheckDto): Promise<void> {
    try {
      const existingUser = await this.userService.findByEmailOrPhoneNumber(
        userDto.email,
        userDto.phoneNumber,
      );

      if (!existingUser && !userDto.phoneNumber) {
        throw new HttpException(
          ErrorMessage.UserNotExist,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        existingUser?.email === userDto.email &&
        existingUser.phoneNumber === userDto.phoneNumber
      ) {
        throw new HttpException(
          ErrorMessage.UserEmailAndPhoneAlreadyExists,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (existingUser && userDto.phoneNumber) {
        throw new HttpException(
          existingUser.email === userDto.email
            ? ErrorMessage.UserEmailAlreadyExists
            : ErrorMessage.UserPhoneNumberAlreadyExists,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async resetPassword({ email, password }: ResetPasswordDto): Promise<void> {
    try {
      await this.accountCheck({ email });

      const passwordHash = await this.hashPassword(password);

      await this.userService.update(email, { password: passwordHash });
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async requestResetOtp({ email }: ResetOtpDto): Promise<void> {
    try {
      const user = await this.userService.findByEmailOrPhoneNumber(email);

      if (!user) {
        throw new HttpException(
          ErrorMessage.UserNotExist,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.sendOtpCodeEmail(
        user.id,
        user.email,
        OtpPurpose.RESET_PASSWORD,
      );
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyResetOtp({ email, code }: VerifyResetOtpDto): Promise<boolean> {
    try {
      const user = await this.userService.findByEmailOrPhoneNumber(email);

      const verificationResult = await this.otpCodeService.verifyOtpCode(
        user.id,
        OtpPurpose.RESET_PASSWORD,
        code,
      );

      if (!verificationResult) {
        throw new HttpException(
          ErrorMessage.VerificationCodeIncorrect,
          HttpStatus.BAD_REQUEST,
        );
      }

      return verificationResult;
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
