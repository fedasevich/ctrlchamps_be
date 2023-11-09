import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import User from 'src/common/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly authRepository: Repository<User>,
  ) {}

  async login(credentials: {
    name: string;
    password: string;
  }): Promise<string> {
    const { name, password } = credentials;

    try {
      const user = await this.authRepository.findOne({ where: { name } });

      if (!user || user.password !== password) {
        throw new Error('Invalid credentials');
      }

      return 'jwt_token';
    } catch (error) {
      throw new Error(error);
    }
  }

  async register(newUser: {
    name: string;
    password: string;
    age: number;
  }): Promise<void> {
    const { name, password, age } = newUser;

    try {
      const existingUser = await this.authRepository.findOne({
        where: { name },
      });

      if (existingUser) {
        throw new Error('User with such name already exists');
      }
      const user = this.authRepository.create({ name, password, age });

      await this.authRepository.save(user);
    } catch (error) {
      throw new Error(error);
    }
  }
}
