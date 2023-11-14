import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { compare, hash } from 'bcrypt';
import { ErrorMessage } from 'common/enums/error-message.enum';
import { UserService } from 'modules/users/user.service';

import { AccountCheckDto } from './dto/account-check.dto';
import { UserCreateDto } from './dto/user-create.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { Token } from './types/token.type';

@Injectable()
export class AuthService {
  private readonly saltRounds = this.configService.get('PASSWORD_SALT_ROUNDS');

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

      if (existingUser) {
        throw new HttpException(
          existingUser.email === userDto.email
            ? ErrorMessage.UserEmailAlreadyExist
            : ErrorMessage.UserPhoneNumberAlreadyExist,
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
}
