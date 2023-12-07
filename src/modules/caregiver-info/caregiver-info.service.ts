import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AppointmentService } from 'modules/appointment/appointment.service';
import { ProfileService } from 'modules/profile/profile.service';
import { UserRole } from 'modules/users/enums/user-role.enum';
import { UserService } from 'modules/users/user.service';
import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { User } from 'src/common/entities/user.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { Repository } from 'typeorm';

import { DetailedCaregiverInfo } from './types/detailed-caregiver-info.type';
import { FiltredCaregiver } from './types/filtred-caregiver.type';

@Injectable()
export class CaregiverInfoService {
  constructor(
    @InjectRepository(CaregiverInfo)
    private readonly caregiverInfoRepository: Repository<CaregiverInfo>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    @Inject(forwardRef(() => AppointmentService))
    private appointmentService: AppointmentService,
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

  async filterAll(
    isOpenToSeekerHomeLiving: boolean,
    services?: string[],
  ): Promise<FiltredCaregiver[]> {
    const formattedServices = services
      ? services.map((service) => `%${service}%`).join(',')
      : null;

    try {
      const queryBuilder = this.userRepository.createQueryBuilder('user');

      queryBuilder.innerJoin('user.caregiverInfo', 'caregiverInfo');

      queryBuilder.andWhere('user.role = :role', {
        role: UserRole.Caregiver,
      });

      queryBuilder.andWhere(
        'user.isOpenToSeekerHomeLiving = :isOpenToSeekerHomeLiving',
        {
          isOpenToSeekerHomeLiving,
        },
      );
      if (formattedServices) {
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
      const caregiverInfo =
        await this.profileService.getProfileInformation(userId);
      const userInfo = await this.userService.findById(userId);
      const count = await this.appointmentService.findAppointmentsCountById(
        caregiverInfo.id,
      );

      const detailedCaregiverInfo = {
        id: userInfo.id,
        isOpenToSeekerHomeLiving: userInfo.isOpenToSeekerHomeLiving,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        numberOfAppointments: count,
        caregiverInfo,
        workExperiences: workExperience,
        qualifications: certificate,
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
