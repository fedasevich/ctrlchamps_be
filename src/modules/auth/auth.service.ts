import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { hash } from 'bcrypt';
import { ErrorMessage } from 'common/enums';
import { UserService } from 'modules/users/user.service';

import { UserCreateDto } from './dto/user-create.dto';
import { Token } from './types';

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
      const userByEmail = await this.userService.findByEmail(userDto.email);

      if (userByEmail) {
        throw new HttpException(
          ErrorMessage.UserEmailAlreadyExist,
          HttpStatus.BAD_REQUEST,
        );
      }

      const userByPhoneNumber = await this.userService.findByPhoneNumber(
        userDto.phoneNumber,
      );

      if (userByPhoneNumber) {
        throw new HttpException(
          ErrorMessage.UserPhoneNumberAlreadyExist,
          HttpStatus.BAD_REQUEST,
        );
      }

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
}
