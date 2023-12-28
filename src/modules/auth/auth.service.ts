import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { compare, hash } from 'bcrypt';
import { ErrorMessage } from 'common/enums/error-message.enum';
import { EmailErrorMessage } from 'modules/email/enums/email-error-message.enum';
import { EmailService } from 'modules/email/services/email.service';
import { UserRole } from 'modules/users/enums/user-role.enum';
import { UserService } from 'modules/users/user.service';

import { AccountCheckDto } from './dto/account-check.dto';
import { UserCreateDto } from './dto/user-create.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { generateOtpCode } from './helpers/generate-otp-code.helper';
import { Token } from './types/token.type';
import { AuthenticatedRequest } from './types/user.request.type';

@Injectable()
export class AuthService {
  private readonly saltRounds = this.configService.get<number>(
    'PASSWORD_SALT_ROUNDS',
  );

  private readonly otpCodeTemplateId = this.configService.get<string>(
    'SENDGRID_OTP_TEMPLATE_ID',
  );

  private readonly caregiverVerifiedTemplateId = this.configService.get<string>(
    'SENDGRID_CAREGIVER_TEMPLATE_ID',
  );

  private readonly seekerVerifiedTemplateId = this.configService.get<string>(
    'SENDGRID_SEEKER_TEMPLATE_ID',
  );

  private readonly caregiverRedirectLink = this.configService.get<string>(
    'CAREGIVER_REDIRECT_LINK',
  );

  private readonly seekerRedirectLink = this.configService.get<string>(
    'SEEKER_REDIRECT_LINK',
  );

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async signUp(userDto: UserCreateDto): Promise<Token> {
    try {
      await this.accountCheck({
        email: userDto.email,
        phoneNumber: userDto.phoneNumber,
      });

      const passwordHash = await this.hashPassword(userDto.password);

      const user = await this.userService.create({
        ...userDto,
        password: passwordHash,
      });

      await this.sendOtpCodeEmail(userDto.email);

      const token = await this.createToken(user);

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
        token: await this.createToken({
          firstName: user.firstName,
          id: user.id,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
          balance: user.balance,
        }),
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

      await this.sendOtpCodeEmail(user.email);
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

  async verifyAccount(userId: string, otpCode: string): Promise<void> {
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

      if (user.otpCode !== otpCode) {
        throw new HttpException(
          ErrorMessage.OtpCodeIncorrect,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.userService.update(user.email, {
        isVerified: true,
        otpCode: null,
      });
      await this.sendVerifiedEmail(user.email, user.role);
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

  private async sendOtpCodeEmail(email: string): Promise<void> {
    try {
      const otpCode = generateOtpCode();

      await this.userService.update(email, { otpCode });

      await this.emailService.sendEmail({
        to: email,
        templateId: this.otpCodeTemplateId,
        dynamicTemplateData: { otpCode },
      });
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedSendVerificationCode,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async sendVerifiedEmail(email: string, role: string): Promise<void> {
    const link =
      role === UserRole.Caregiver
        ? this.caregiverRedirectLink
        : this.seekerRedirectLink;
    try {
      await this.emailService.sendEmail({
        to: email,
        templateId:
          role === UserRole.Caregiver
            ? this.caregiverVerifiedTemplateId
            : this.seekerVerifiedTemplateId,
        dynamicTemplateData: { link },
      });
    } catch (error) {
      throw new HttpException(
        EmailErrorMessage.FailedSendEmail,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async createToken(
    user: AuthenticatedRequest['user'],
  ): Promise<string> {
    try {
      return this.jwtService.sign({
        firstName: user.firstName,
        id: user.id,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
        balance: user.balance,
      });
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

  async resetPassword(email: string, password: string): Promise<void> {
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

  async requestResetOtp(email: string): Promise<void> {
    try {
      const user = await this.userService.findByEmailOrPhoneNumber(email);

      if (!user) {
        throw new HttpException(
          ErrorMessage.UserNotExist,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.sendOtpCodeEmail(email);
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

  async verifyResetOtp(email: string, otpCode: string): Promise<void> {
    try {
      const user = await this.userService.findByEmailOrPhoneNumber(email);

      if (user.otpCode !== otpCode) {
        throw new HttpException(
          ErrorMessage.OtpCodeIncorrect,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.userService.update(email, {
        otpCode: null,
      });
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
