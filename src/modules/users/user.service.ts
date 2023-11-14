import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from 'common/entities/user.entity';
import { UserCreateDto } from 'modules/auth/dto/user-create.dto';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmailOrPhoneNumber(
    email: string,
    phoneNumber: string,
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

  async create(userDto: UserCreateDto): Promise<string> {
    try {
      const user = await this.userRepository
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(userDto)
        .execute();

      return user.generatedMaps[0].id as string;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
