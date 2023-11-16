import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { User } from 'common/entities/user.entity';
import { ApiPath } from 'common/enums/api-path.enum';
import { ErrorMessage } from 'common/enums/error-message.enum';
import { OtpCodeVerifyDto } from 'modules/otp-code/dto/otp-code-verify.dto';

import { AuthService } from './auth.service';
import { AccountCheckDto } from './dto/account-check.dto';
import { UserCreateDto } from './dto/user-create.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { AuthApiPath } from './enums';
import { Token } from './types/token.type';

@ApiTags('Authorization')
@Controller(ApiPath.Auth)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(AuthApiPath.SignUp)
  @ApiOperation({ summary: 'User Sign up' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.UserEmailAlreadyExist,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async signUp(@Body() userDto: UserCreateDto): Promise<Token> {
    return this.authService.signUp(userDto);
  }

  @Post(AuthApiPath.SignIn)
  @ApiOperation({ summary: 'Sign in user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User signed in successfully',
    schema: {
      example: {
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU0MDg5Yjg2LTYzZTctNGZhOC1iZjAwLWRhNmRkMDBkZjFmYSIsImlhdCI6MTcwMDA4MDIxOSwiZXhw',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ErrorMessage.BadLoginCredentials,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() loginDto: UserLoginDto): Promise<Token> {
    return this.authService.signIn(loginDto);
  }

  @ApiOperation({ summary: 'Check user email and phone number' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'No existing user found with the provided credentials',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.UserEmailAlreadyExist,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(AuthApiPath.AccountCheck)
  async accountCheck(@Body() userDto: AccountCheckDto): Promise<void> {
    await this.authService.accountCheck(userDto);
  }

  @ApiOperation({ summary: 'Verify user account' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.VerificationCodeIncorrect,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(AuthApiPath.VerifyAccount)
  async verifyAccount(
    @Param('userId') userId: string,
    @Body() otpCodeVerifyDto: OtpCodeVerifyDto,
  ): Promise<void> {
    await this.authService.verifyAccount(userId, otpCodeVerifyDto);
  }

  @ApiOperation({ summary: 'Request new verification code' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.NoExistingUser,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.UserAlreadyVerified,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(AuthApiPath.RequestNewVerificationCode)
  async requestNewVerificationCode(
    @Param('userId') userId: string,
  ): Promise<void> {
    await this.authService.requestNewVerificationCode(userId);
  }
}
