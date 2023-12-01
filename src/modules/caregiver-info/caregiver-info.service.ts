import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ProfileService } from 'modules/profile/profile.service';
import { UserRole } from 'modules/users/enums/user-role.enum';
import { UserService } from 'modules/users/user.service';
import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { User } from 'src/common/entities/user.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { Repository } from 'typeorm';

import { DetailedCaregiverInfo } from './types/detailed-caregiver-info.type';
import { FiltredCaregiver } from './types/filtred-caregiver.type';
import { ParsedParams } from './types/parsed-params.type';

@Injectable()
export class CaregiverInfoService {
  constructor(
    @InjectRepository(CaregiverInfo)
    private readonly caregiverInfoRepository: Repository<CaregiverInfo>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
  ) {}

  async findById(caregiverInfoId: string): Promise<CaregiverInfo> {
    try {
      return await this.caregiverInfoRepository
        .createQueryBuilder('caregiverInfoId')
        .where('caregiverInfoId.id = :caregiverInfoId', {
          caregiverInfoId,
        })
        .getOne();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.CaregiverInfoNotFound,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async filterAll(query: string): Promise<FiltredCaregiver[]> {
    const params = new URLSearchParams(query);
    const parsedParams: Partial<ParsedParams> = {};

    params.forEach((value, key) => {
      if (value === 'true' || value === 'false') {
        parsedParams[key] = value === 'true';
      } else if (value.startsWith('[') && value.endsWith(']')) {
        parsedParams[key] = JSON.parse(value);
      } else {
        parsedParams[key] = value;
      }
    });

    const formattedServices = parsedParams.services
      .map((service) => `%${service}%`)
      .join(',');

    try {
      const queryBuilder = this.userRepository.createQueryBuilder('user');

      queryBuilder.innerJoin('user.caregiverInfo', 'caregiverInfo');

      queryBuilder.andWhere('user.role = :role', {
        role: UserRole.Caregiver,
      });

      queryBuilder.andWhere(
        'user.isOpenToSeekerHomeLiving = :isOpenToSeekerHomeLiving',
        {
          isOpenToSeekerHomeLiving: parsedParams.isOpenToSeekerHomeLiving,
        },
      );
      if (parsedParams.services.length > 0) {
        queryBuilder.andWhere('caregiverInfo.services LIKE :services', {
          services: formattedServices,
        });
      }

      queryBuilder.select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'caregiverInfo.hourlyRate',
      ]);

      const filteredCaregivers = await queryBuilder.getMany();

      return filteredCaregivers.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        hourlyRate: user.caregiverInfo.hourlyRate,
      }));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getDetailedInfo(userId: string): Promise<DetailedCaregiverInfo> {
    try {
      const workExperience =
        await this.profileService.getWorkExperiences(userId);
      const certificate = await this.profileService.getUserCertificates(userId);
      const profileInfo =
        await this.profileService.getProfileInformation(userId);
      const userInfo = await this.userService.findById(userId);

      const detailedCaregiverInfo = {
        id: userInfo.id,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        isOpenToSeekerHomeLiving: userInfo.isOpenToSeekerHomeLiving,
        numberOfAppointments: 2,
        hourlyRate: profileInfo.hourlyRate,
        description: profileInfo.description,
        videoLink: profileInfo.videoLink,
        services: profileInfo.services,
        certificates: certificate,
        workExperiences: workExperience,
      };

      return detailedCaregiverInfo;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
