import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from 'src/common/entities/user.entity';
import { UserRole } from 'src/modules/users/enums/user-role.enum';
import { Repository } from 'typeorm';

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
      const searchKeyword = query.search || '';

      const [result, total] = await this.userRepository
        .createQueryBuilder('user')
        .where('user.role IN (:...roles)', {
          roles: [UserRole.Admin, UserRole.SuperAdmin],
        })
        .andWhere(
          `(user.firstName LIKE :keyword OR user.lastName LIKE :keyword OR user.email LIKE :keyword)`,
          { keyword: `%${searchKeyword}%` },
        )
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
