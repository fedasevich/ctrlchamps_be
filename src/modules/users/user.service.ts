import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { User } from 'common/entities/user.entity';
import { UserCreateDto } from 'modules/auth/dto/user-create.dto';
import { PasswordService } from 'modules/update-password/update-password.service';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { EmailService } from 'src/modules/email/services/email.service';
import {
  DEFAULT_OFFSET,
  DEFAULT_PAGINATION_LIMIT,
} from 'src/modules/users/constants/user-info.constants';
import { SortOrder } from 'src/modules/users/enums/sort-query.enum';
import { FilteredUserList } from 'src/modules/users/types/filtered-user-list.type';
import { UserQuery } from 'src/modules/users/types/user-query.type';
import { EntityManager, Repository } from 'typeorm';

import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserUpdateDto } from './dto/user-update-info.dto';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly passwordService: PasswordService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private readonly s3Client = new S3Client({
    region: this.configService.get<string>('AWS_S3_REGION'),
    credentials: {
      accessKeyId: this.configService.get<string>('ACCESS_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_KEY'),
    },
  });

  private readonly updateUserPasswordTemplateId =
    this.configService.get<string>('SENDGRID_UPDATE_USER_PASSWORD_TEMPLATE_ID');

  private readonly deleteUserTemplateId = this.configService.get<string>(
    'SENDGRID_DELETE_USER_TEMPLATE_ID',
  );

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
    email?: string,
    phoneNumber?: string,
  ): Promise<User> {
    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .where('user.email = :email OR user.phoneNumber = :phoneNumber', {
          email,
          phoneNumber,
        })
        .getOne();

      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
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
        ErrorMessage.FailedUpdateUser,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updatePassword(userData: UpdatePasswordDto): Promise<void> {
    try {
      const user = await this.findByEmailOrPhoneNumber(userData.email);

      if (!user) {
        throw new HttpException(
          ErrorMessage.UserProfileNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.passwordService.updatePassword(user.password, userData);

      await this.emailService.sendEmail({
        to: user.email,
        templateId: this.updateUserPasswordTemplateId,
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async uploadAvatar(
    fileName: string,
    file: Buffer,
    userId: string,
  ): Promise<void> {
    try {
      const uploadResponse = await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.configService.get<string>('AWS_BUCKET_NAME'),
          Key: fileName,
          Body: file,
          ContentType: `image/${fileName.split('.').pop()}`,
          ContentDisposition: 'inline',
        }),
      );
      if (uploadResponse.$metadata.httpStatusCode === HttpStatus.OK) {
        const user = await this.findById(userId);
        const s3ObjectUrl =
          this.configService.get('AWS_FILES_STORAGE_URL') + fileName;

        user.avatar = s3ObjectUrl;

        await this.userRepository.save(user);
      }
    } catch (error) {
      throw new HttpException(
        ErrorMessage.BacketNotFound,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async delete(userId: string): Promise<void> {
    try {
      const user = await this.findById(userId);

      if (!user) {
        throw new HttpException(
          ErrorMessage.UserProfileNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      if (user.role === UserRole.SuperAdmin) {
        throw new HttpException(
          ErrorMessage.SuperAdminDeleteForbidden,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.userRepository
        .createQueryBuilder()
        .delete()
        .from(User)
        .where('id = :id', { id: userId })
        .execute();

      await this.emailService.sendEmail({
        to: user.email,
        templateId: this.deleteUserTemplateId,
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getFilteredUsers({
    limit = DEFAULT_PAGINATION_LIMIT,
    offset = DEFAULT_OFFSET,
    search = '',
    sort = SortOrder.DESC,
  }: UserQuery): Promise<FilteredUserList> {
    try {
      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .where('user.role NOT IN (:...roles)', {
          roles: [UserRole.Admin, UserRole.SuperAdmin],
        })
        .andWhere('user.isDeletedByAdmin = :isDeletedByAdmin', {
          isDeletedByAdmin: false,
        })
        .select([
          'user.id',
          'user.firstName',
          'user.lastName',
          'user.role',
          'user.status',
        ]);

      if (search) {
        queryBuilder.andWhere(
          `(user.firstName LIKE :keyword OR user.lastName LIKE :keyword)`,
          { keyword: `%${search}%` },
        );
      }

      const [result, total] = await queryBuilder
        .take(limit)
        .skip(offset)
        .orderBy('user.createdAt', sort)
        .getManyAndCount();

      return {
        data: result,
        count: total,
      };
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedFetchUsers,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findCaregiverInfoByUserId(userId: string): Promise<User> {
    try {
      return await this.userRepository
        .createQueryBuilder('user')
        .where('user.id = :userId', {
          userId,
        })
        .innerJoinAndSelect('user.caregiverInfo', 'caregiverInfo')
        .getOne();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.CaregiverNotExist,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
