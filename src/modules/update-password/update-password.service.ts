import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { compare, hash } from 'bcrypt';
import { User } from 'src/common/entities/user.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { UpdatePasswordDto } from 'src/modules/users/dto/update-password.dto';
import { Repository } from 'typeorm';

import { SALT_LENGTH } from './constants';

@Injectable()
export class PasswordService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async resetPassword(email: string, password: string): Promise<void> {
    try {
      const hashedPassword = await this.hashPassword(password);

      await this.userRepository
        .createQueryBuilder('user')
        .update(User)
        .set({ password: hashedPassword })
        .where('user.email = :email', { email })
        .execute();
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updatePassword(
    currentPassword: string,
    userPasswordData: UpdatePasswordDto,
  ): Promise<void> {
    try {
      const { email, oldPassword, newPassword } = userPasswordData;

      const validPassword = await this.checkPasswordValidity(
        oldPassword,
        currentPassword,
      );

      if (!validPassword) {
        throw new HttpException(
          ErrorMessage.InvalidProvidedPassword,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.resetPassword(email, newPassword);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async hashPassword(password: string): Promise<string> {
    try {
      return await hash(password, SALT_LENGTH);
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedHashPassword,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkPasswordValidity(
    providedPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      const validPassword = await compare(providedPassword, hashedPassword);
      if (validPassword) {
        return true;
      }

      return false;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
