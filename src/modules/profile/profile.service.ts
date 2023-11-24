import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    @InjectRepository(WorkExperience)
    private readonly workExperienceRepository: Repository<WorkExperience>,
    @InjectRepository(UserAdditionalInfo)
    private readonly profileRepository: Repository<UserAdditionalInfo>,
  ) {}

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
    const userAdditionalInfo = await this.profileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['workExperiences'], // Ensure the relation is loaded
    });

    if (!userAdditionalInfo) {
      throw new HttpException(
        ErrorMessage.UserProfileNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return userAdditionalInfo.workExperiences;
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> {
    const userAdditionalInfo = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!userAdditionalInfo) {
      throw new HttpException(
        ErrorMessage.UserProfileNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

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

    const { services, availability, hourlyRate, description, videoLink } =
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

    if (videoLink) {
      userAdditionalInfo.videoLink = videoLink;
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
}
