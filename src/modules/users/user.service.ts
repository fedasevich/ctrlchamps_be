import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from 'common/entities/user.entity';
import { UserCreateDto } from 'modules/auth/dto/user-create.dto';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { EntityManager, Repository } from 'typeorm';

import { UserUpdateDto } from './dto/user-update-info.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(userId: string): Promise<User> {
    try {
      return await this.userRepository
        .createQueryBuilder('user')
        .where('user.id = :userId', {
          userId,
        })
        .getOne();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByEmailOrPhoneNumber(
    email: string,
    phoneNumber?: string,
  ): Promise<User> {
    try {
      return await this.userRepository
        .createQueryBuilder('user')
        .where('user.email = :email OR user.phoneNumber = :phoneNumber', {
          email,
          phoneNumber,
        })
        .getOne();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async create(userDto: UserCreateDto): Promise<User> {
    try {
      const user = await this.userRepository
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(userDto)
        .execute();

      return user.generatedMaps[0] as User;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyAccount(userId: string): Promise<void> {
    try {
      await this.userRepository.update(userId, { isVerified: true });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(email: string, userDto: Partial<User>): Promise<void> {
    try {
      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set(userDto)
        .where('user.email = :email', {
          email,
        })
        .execute();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateWithTransaction(
    email: string,
    userDto: Partial<User>,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    try {
      await transactionalEntityManager
        .createQueryBuilder()
        .update(User)
        .set(userDto)
        .where('user.email = :email', {
          email,
        })
        .execute();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserInfo(userId: string): Promise<User> {
    try {
      const user = await this.findById(userId);

      if (!user) {
        throw new HttpException(
          ErrorMessage.UserProfileNotFound,
          HttpStatus.BAD_REQUEST,
        );
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateUserInfo(
    userId: string,
    userInfo: Partial<UserUpdateDto>,
  ): Promise<void> {
    try {
      const user = await this.findById(userId);

      if (!user) {
        throw new HttpException(
          ErrorMessage.UserProfileNotFound,
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set(userInfo)
        .where('user.id = :userId', {
          userId,
        })
        .execute();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedUpdateAppointment,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
