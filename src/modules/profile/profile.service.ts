import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Certificate } from 'src/common/entities/certificate.entity';
import { User } from 'src/common/entities/user.entity';
import { UserAdditionalInfo } from 'src/common/entities/user.profile.entity';
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
    @InjectRepository(UserAdditionalInfo)
    private readonly profileRepository: Repository<UserAdditionalInfo>,
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
  ): Promise<UserAdditionalInfo | undefined> {
    const userAdditionalInfo = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!userAdditionalInfo) {
      throw new HttpException(
        ErrorMessage.UserProfileNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return userAdditionalInfo;
  }

  async getWorkExperiences(userId: string): Promise<WorkExperience[]> {
    const workExperiences = await this.workExperienceRepository.find({
      where: { userAdditionalInfo: { user: { id: userId } } },
    });

    if (!workExperiences || workExperiences.length === 0) {
      throw new HttpException(
        ErrorMessage.WorkExpNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return workExperiences;
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> {
    const certificates = await this.certificateRepository.find({
      where: { userAdditionalInfo: { user: { id: userId } } },
    });

    if (!certificates || certificates.length === 0) {
      throw new HttpException(
        ErrorMessage.CertificatesNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return certificates;
  }

  async createProfile(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new HttpException(
        ErrorMessage.UserNotExist,
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingProfile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existingProfile) {
      console.log(existingProfile);
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

    const userAdditionalInfo = new UserAdditionalInfo();
    userAdditionalInfo.user = user;

    await this.profileRepository.save(userAdditionalInfo);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new HttpException(
        ErrorMessage.UserProfileNotFound,
        HttpStatus.BAD_REQUEST,
      );
    }

    const userAdditionalInfo = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });

    const { services, availability, hourlyRate, description } =
      updateProfileDto;

    if (services) {
      userAdditionalInfo.services = services;
    }

    if (availability) {
      userAdditionalInfo.availability = availability;
    }

    if (hourlyRate) {
      userAdditionalInfo.hourlyRate = hourlyRate;
    }

    if (description) {
      userAdditionalInfo.description = description;
    }

    await this.profileRepository.save(userAdditionalInfo);
  }

  async createCertificate(
    userId: string,
    createCertificatesDto: CreateCertificatesDto,
  ): Promise<Certificate[]> {
    const userAdditionalInfo = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!userAdditionalInfo) {
      throw new HttpException(
        ErrorMessage.UserProfileNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const certificates = await Promise.all(
      createCertificatesDto.certificates.map(async (certificateDto) => {
        const newCertificate = new Certificate();
        Object.assign(newCertificate, certificateDto);
        newCertificate.userAdditionalInfo = userAdditionalInfo;

        return this.certificateRepository.save(newCertificate);
      }),
    );

    return certificates;
  }

  async createWorkExperience(
    userId: string,
    createWorkExperienceDto: CreateWorkExperienceDto,
  ): Promise<WorkExperience[]> {
    const userAdditionalInfo = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!userAdditionalInfo) {
      throw new HttpException(
        ErrorMessage.UserProfileNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const workExperiences = await Promise.all(
      createWorkExperienceDto.workExperiences.map(async (workExperienceDto) => {
        const newWorkExperience = new WorkExperience();
        Object.assign(newWorkExperience, workExperienceDto);
        newWorkExperience.userAdditionalInfo = userAdditionalInfo;

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
        }),
      );
      if (uploadResponse.$metadata.httpStatusCode === HttpStatus.OK) {
        const userAdditionalInfo = await this.profileRepository.findOne({
          where: { user: { id: userId } },
        });
        const s3ObjectUrl =
          this.configService.get('AWS_FILES_STORAGE_URL') + fileName;

        userAdditionalInfo.videoLink = s3ObjectUrl;

        await this.profileRepository.save(userAdditionalInfo);
      }
    } catch (error) {
      throw new Error("Couldn't find bucket to save");
    }
  }
}
