import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { Certificate } from 'src/common/entities/certificate.entity';
import { User } from 'src/common/entities/user.entity';
import { WorkExperience } from 'src/common/entities/work-experience.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { UserRole } from 'src/modules/users/enums/user-role.enum';
import { Repository } from 'typeorm';

import { UpdateProfileDto } from './dto/additional-info.dto';
import { CreateCertificatesDto } from './dto/create-certificate.dto';
import { CreateWorkExperienceDto } from './dto/create-work-experience.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    @InjectRepository(WorkExperience)
    private readonly workExperienceRepository: Repository<WorkExperience>,
    @InjectRepository(CaregiverInfo)
    private readonly profileRepository: Repository<CaregiverInfo>,
  ) {}

  private readonly s3Client = new S3Client({
    region: this.configService.get<string>('AWS_S3_REGION'),
    credentials: {
      accessKeyId: this.configService.get<string>('ACCESS_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_KEY'),
    },
  });

  async getProfileInformation(
    userId: string,
  ): Promise<CaregiverInfo | undefined> {
    const caregiverInfo = await this.profileRepository
      .createQueryBuilder('profile')
      .where('profile.user = :userId', { userId })
      .getOne();

    if (!caregiverInfo) {
      throw new HttpException(
        ErrorMessage.UserProfileNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return caregiverInfo;
  }

  async getWorkExperiences(userId: string): Promise<WorkExperience[]> {
    const workExperiences = await this.workExperienceRepository
      .createQueryBuilder('workExperience')
      .innerJoin('workExperience.caregiverInfo', 'caregiverInfo')
      .innerJoin('caregiverInfo.user', 'user')
      .where('user.id = :userId', { userId })
      .getMany();

    if (!workExperiences || workExperiences.length === 0) {
      throw new HttpException(
        ErrorMessage.WorkExpNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return workExperiences;
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> {
    const certificates = await this.certificateRepository
      .createQueryBuilder('certificate')
      .innerJoin('certificate.caregiverInfo', 'caregiverInfo')
      .innerJoin('caregiverInfo.user', 'user')
      .where('user.id = :userId', { userId })
      .getMany();

    if (!certificates || certificates.length === 0) {
      throw new HttpException(
        ErrorMessage.CertificatesNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return certificates;
  }

  async createProfile(userId: string): Promise<void> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new HttpException(
        ErrorMessage.UserNotExist,
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingProfile = await this.profileRepository
      .createQueryBuilder('profile')
      .where('profile.user.id = :userId', { userId })
      .getOne();

    if (existingProfile) {
      throw new HttpException(
        ErrorMessage.UserProfileAlreadyExists,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.role !== UserRole.Caregiver) {
      throw new HttpException(
        ErrorMessage.UserIsNotCaregiver,
        HttpStatus.FORBIDDEN,
      );
    }

    const caregiverInfo = new CaregiverInfo();
    caregiverInfo.user = user;

    await this.profileRepository.save(caregiverInfo);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<void> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new HttpException(
        ErrorMessage.UserProfileNotFound,
        HttpStatus.BAD_REQUEST,
      );
    }

    const caregiverInfo = await this.profileRepository
      .createQueryBuilder('profile')
      .where('profile.user = :userId', { userId })
      .getOne();

    const { services, availability, hourlyRate, description } =
      updateProfileDto;

    if (services) {
      caregiverInfo.services = services;
    }

    if (availability) {
      caregiverInfo.availability = availability;
    }

    if (hourlyRate) {
      caregiverInfo.hourlyRate = hourlyRate;
    }

    if (description) {
      caregiverInfo.description = description;
    }

    await this.profileRepository.save(caregiverInfo);
  }

  async createCertificate(
    userId: string,
    createCertificatesDto: CreateCertificatesDto,
  ): Promise<Certificate[]> {
    const caregiverInfo = await this.profileRepository
      .createQueryBuilder('profile')
      .where('profile.user = :userId', { userId })
      .getOne();

    if (!caregiverInfo) {
      throw new HttpException(
        ErrorMessage.UserProfileNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const certificates = await Promise.all(
      createCertificatesDto.certificates.map(async (certificateDto) => {
        const newCertificate = new Certificate();
        Object.assign(newCertificate, certificateDto);
        newCertificate.caregiverInfo = caregiverInfo;

        return this.certificateRepository.save(newCertificate);
      }),
    );

    return certificates;
  }

  async createWorkExperience(
    userId: string,
    createWorkExperienceDto: CreateWorkExperienceDto,
  ): Promise<WorkExperience[]> {
    const caregiverInfo = await this.profileRepository
      .createQueryBuilder('profile')
      .where('profile.user = :userId', { userId })
      .getOne();

    if (!caregiverInfo) {
      throw new HttpException(
        ErrorMessage.UserProfileNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const workExperiences = await Promise.all(
      createWorkExperienceDto.workExperiences.map(async (workExperienceDto) => {
        const newWorkExperience = new WorkExperience();
        Object.assign(newWorkExperience, workExperienceDto);
        newWorkExperience.caregiverInfo = caregiverInfo;

        return this.workExperienceRepository.save(newWorkExperience);
      }),
    );

    return workExperiences;
  }

  async upload(fileName: string, file: Buffer, userId: string): Promise<void> {
    try {
      const uploadResponse = await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.configService.get<string>('AWS_BUCKET_NAME'),
          Key: fileName,
          Body: file,
          ContentType: `video/${fileName.split('.').pop()}`,
          ContentDisposition: 'inline',
        }),
      );
      if (uploadResponse.$metadata.httpStatusCode === HttpStatus.OK) {
        const caregiverInfo = await this.profileRepository
          .createQueryBuilder('profile')
          .where('profile.user = :userId', { userId })
          .getOne();
        const s3ObjectUrl =
          this.configService.get('AWS_FILES_STORAGE_URL') + fileName;

        caregiverInfo.videoLink = s3ObjectUrl;

        await this.profileRepository.save(caregiverInfo);
      }
    } catch (error) {
      throw new HttpException(
        ErrorMessage.BacketNotFound,
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
