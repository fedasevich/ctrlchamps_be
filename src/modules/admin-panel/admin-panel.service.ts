import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from 'src/common/entities/user.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { AuthService } from 'src/modules/auth/auth.service';
import { PasswordService } from 'src/modules/update-password/update-password.service';
import { UserRole } from 'src/modules/users/enums/user-role.enum';
import { UserService } from 'src/modules/users/user.service';
import { Repository } from 'typeorm';

import { PAGINATION_LIMIT } from './constants/admin-panel.constants';
import { AdminCreateDto } from './dto/admin-create.dto';
import { AdminUpdateDto } from './dto/admin-update.dto';
import { PasswordUpdateDto } from './dto/password-update.dto';
import {
  AdminDetails,
  AdminListResponse,
  UserQuery,
} from './types/admin-panel.types';

@Injectable()
export class AdminPanelService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly authService: AuthService,
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
        .orderBy('user.updatedAt', 'DESC')
        .getManyAndCount();

      return {
        data: result,
        count: total,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllAdmins(): Promise<User[]> {
    try {
      const admins = await this.userRepository
        .createQueryBuilder('user')
        .where('user.role IN (:...roles)', {
          roles: [UserRole.Admin, UserRole.SuperAdmin],
        })
        .getMany();

      return admins;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createAdmin(adminDto: AdminCreateDto): Promise<void> {
    try {
      if (adminDto.role !== UserRole.Admin) {
        throw new HttpException(
          ErrorMessage.NotAdminRole,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.authService.accountCheck({
        email: adminDto.email,
        phoneNumber: adminDto.phoneNumber,
      });

      const hashedPassword = await this.passwordService.hashPassword(
        adminDto.password,
      );
      await this.userService.create({
        ...adminDto,
        isVerified: true,
        password: hashedPassword,
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

  async updateAdmin(
    adminId: string,
    adminInfo: Partial<AdminUpdateDto>,
  ): Promise<void> {
    if (adminInfo.role !== UserRole.Admin) {
      throw new HttpException(
        ErrorMessage.NotAdminRole,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const admin = await this.userService.findById(adminId);

      if (!admin) {
        throw new HttpException(
          ErrorMessage.UserProfileNotFound,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set(adminInfo)
        .where('user.id = :adminId', {
          adminId,
        })
        .execute();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedUpdateUser,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAdminInfo(adminId: string): Promise<AdminDetails> {
    try {
      const admin = await this.userService.findById(adminId);

      if (!admin) {
        throw new HttpException(
          ErrorMessage.UserProfileNotFound,
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        role: admin.role,
        updatedAt: admin.updatedAt,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updatePassword(
    adminId: string,
    passwordDto: PasswordUpdateDto,
  ): Promise<void> {
    try {
      const { password } = passwordDto;
      const admin = await this.userService.findById(adminId);

      if (!admin) {
        throw new HttpException(
          ErrorMessage.UserProfileNotFound,
          HttpStatus.BAD_REQUEST,
        );
      }

      const hashedPassword = await this.passwordService.hashPassword(password);

      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({ password: hashedPassword })
        .where('user.id = :adminId', {
          adminId,
        })
        .execute();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedUpdateUser,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
