import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { User } from 'common/entities/user.entity';
import { UserCreateDto } from 'modules/auth/dto/user-create.dto';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { EntityManager, Repository } from 'typeorm';

import { UserUpdateDto } from './dto/user-update-info.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
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
}
