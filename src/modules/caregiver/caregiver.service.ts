import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { UserRole } from 'modules/users/enums/user-role.enum';
import { UserService } from '../users/user.service';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { Certificate } from 'src/common/entities/certificate.entity';
import { User } from 'src/common/entities/user.entity';
import { WorkExperience } from 'src/common/entities/work-experience.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { Repository, Brackets, FindManyOptions } from 'typeorm';

import { FiltredCaregiver } from './types/filtred-caregiver.type';
import { ProfileService } from '../profile/profile.service';

interface ParsedParams {
  isOpenToSeekerHomeLiving: boolean;
  isShowAvailableCaregivers: boolean;
  country: string;
  city: string;
  address: string;
  state: string;
  zipCode: string;
  utcOffset: string;
  services: string[];
}

@Injectable()
export class CaregiverService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CaregiverInfo)
    private readonly profileRepository: Repository<CaregiverInfo>,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
  ) {}

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

      queryBuilder.andWhere('caregiverInfo.services LIKE :services', {
        services: formattedServices,
      });

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

  async getDetailedInfo(userId: string) {
    try {
      const workExpierience =
        await this.profileService.getWorkExperiences(userId);
      const certificates =
        await this.profileService.getUserCertificates(userId);
      console.log(workExpierience, certificates);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return {
      id: '2f09b807-72ee-49ea-83d2-17b7746957a3',
      hourlyRate: 25,
      firstName: 'Alice',
      lastName: 'James',
      isOpenToSeekerHomeLiving: true,
      numberOfAppointments: 2,
      description: 'I am an experienced nurse..',
      videoLink: 'https://youtube.com/user/video',
      services: ['Personal Care Assistance', 'Medication Management'],
      certificates: [
        {
          name: 'First Aid Training',
          certificateId: 'CER12345',
          link: 'https://certificateprovider.com/certificate/123',
          dateIssued: '2020-11-11',
          expirationDate: '2021-11-11',
        },
      ],
      workExperiences: [
        {
          workplace: 'ABC Hospital',
          qualifications: 'Clinic',
          startDate: '2020-11-11',
          endDate: '2021-11-11',
        },
      ],
    };
  }
}
