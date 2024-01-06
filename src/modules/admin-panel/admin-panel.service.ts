import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from 'src/common/entities/user.entity';
import { UserRole } from 'src/modules/users/enums/user-role.enum';
import { Brackets, Repository } from 'typeorm';

import { PAGINATION_LIMIT } from './constants/admin-panel.constants';
import { AdminListResponse, UserQuery } from './types/admin-panel.types';

@Injectable()
export class AdminPanelService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async fetchAdmins(query: UserQuery): Promise<AdminListResponse> {
    try {
      const limit = query.limit || PAGINATION_LIMIT;
      const offset = query.offset || 0;
      const email = query.email || '';
      const name = query.name || '';

      const [result, total] = await this.userRepository
        .createQueryBuilder('user')
        .where('user.role IN (:...roles)', {
          roles: [UserRole.Admin, UserRole.SuperAdmin],
        })
        .andWhere(
          new Brackets((qb) => {
            qb.where('user.firstName LIKE :name', { name: `%${name}%` });
            qb.orWhere('user.lastName LIKE :name', { name: `%${name}%` });
          }),
        )
        .andWhere('user.email LIKE :email', { email: `%${email}%` })
        .take(limit)
        .skip(offset)
        .getManyAndCount();

      return {
        data: result,
        count: total,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
