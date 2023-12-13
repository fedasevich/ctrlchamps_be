import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AppointmentService } from 'modules/appointment/appointment.service';
import { UserRole } from 'modules/users/enums/user-role.enum';
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
      const userInfo = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.caregiverInfo', 'caregiverInfo')
        .addSelect([
          'caregiverInfo.id',
          'caregiverInfo.description',
          'caregiverInfo.hourlyRate',
          'caregiverInfo.videoLink',
          'caregiverInfo.services',
        ])
        .innerJoinAndSelect('caregiverInfo.workExperiences', 'workExperiences')
        .innerJoinAndSelect('caregiverInfo.certificates', 'certificates')
        .where('user.id = :userId', { userId })
        .getOne();

      const count = await this.appointmentService.findAppointmentsCountById(
        userInfo.caregiverInfo.id,
      );

      const { workExperiences, certificates, ...caregiverInfo } =
        userInfo.caregiverInfo;

      const detailedCaregiverInfo = {
        id: userInfo.id,
        isOpenToSeekerHomeLiving: userInfo.isOpenToSeekerHomeLiving,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        numberOfAppointments: count,
        caregiverInfo,
        workExperiences,
        qualifications: certificates,
      };

      return detailedCaregiverInfo;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findUserByCaregiverInfoId(
    caregiverInfoId: string,
  ): Promise<CaregiverInfo> {
    try {
      return await this.caregiverInfoRepository
        .createQueryBuilder('caregiverInfoId')
        .innerJoinAndSelect('caregiverInfoId.user', 'user')
        .where('caregiverInfoId.id = :caregiverInfoId', {
          caregiverInfoId,
        })
        .getOne();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.UserNotExist,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
