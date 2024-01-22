import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { format, isWithinInterval, parseISO } from 'date-fns';
import { AppointmentService } from 'modules/appointment/appointment.service';
import { UserRole } from 'modules/users/enums/user-role.enum';
import { DATE_FORMAT } from 'src/common/constants/date.constants';
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
    showOnlyAvailableCaregivers: boolean,
    startTime: Date,
    endTime: Date,
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

      queryBuilder.andWhere('caregiverInfo.services IS NOT NULL');
      queryBuilder.andWhere('caregiverInfo.availability IS NOT NULL');
      queryBuilder.andWhere('caregiverInfo.timeZone IS NOT NULL');
      queryBuilder.andWhere('caregiverInfo.hourlyRate IS NOT NULL');
      queryBuilder.andWhere('caregiverInfo.description IS NOT NULL');

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

      if (showOnlyAvailableCaregivers) {
        const caregiversWithAppointments =
          await this.appointmentService.findAppointmentsByTimeRange(
            startTime,
            endTime,
            ['Monday', 'Wednesday', 'Friday'],
          );

        const caregiverIdsWithAppointments = caregiversWithAppointments.map(
          (appointment) => appointment.caregiverInfoId,
        );

        queryBuilder.andWhere(
          'caregiverInfo.id NOT IN (:...caregiverIdsWithAppointments)',
          {
            caregiverIdsWithAppointments,
          },
        );
      }

      const dayOfWeek = format(startTime, 'EEEE');
      const startTimeISO = parseISO(startTime.toISOString());
      const endTimeISO = parseISO(endTime.toISOString());

      if (showOnlyAvailableCaregivers) {
        queryBuilder.andWhere('caregiverInfo.availability LIKE :availability', {
          availability: `%"day": "${dayOfWeek}"%`,
        });
      }

      queryBuilder.select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'caregiverInfo.hourlyRate',
        'caregiverInfo.availability',
      ]);

      const caregivers = await queryBuilder.getMany();

      if (showOnlyAvailableCaregivers) {
        const filteredCaregivers = caregivers.filter((caregiver) => {
          const { availability } = caregiver.caregiverInfo;

          if (availability) {
            const dayAvailability = availability.find(
              (slot) => slot.day === dayOfWeek,
            );

            if (dayAvailability) {
              const slotStartDate = parseISO(
                `${format(startTimeISO, DATE_FORMAT)}T${
                  dayAvailability.startTime
                }:00.000Z`,
              );

              const slotEndDate = parseISO(
                `${format(endTimeISO, DATE_FORMAT)}T${
                  dayAvailability.endTime
                }:00.000Z`,
              );

              return (
                isWithinInterval(startTimeISO, {
                  start: slotStartDate,
                  end: slotEndDate,
                }) &&
                isWithinInterval(endTimeISO, {
                  start: slotStartDate,
                  end: slotEndDate,
                })
              );
            }
          }

          return false;
        });

        return filteredCaregivers.map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          hourlyRate: user.caregiverInfo.hourlyRate,
        }));
      }

      return caregivers.map((user) => ({
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
          'caregiverInfo.availability',
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

  async isCaregiverInfoFilled(userId: string): Promise<boolean> {
    try {
      const caregiverInfo = await this.caregiverInfoRepository
        .createQueryBuilder('caregiverInfo')
        .leftJoinAndSelect('caregiverInfo.workExperiences', 'workExperiences')
        .leftJoinAndSelect('caregiverInfo.certificates', 'certificates')
        .where('caregiverInfo.userId = :userId', { userId })
        .getOne();

      if (!caregiverInfo) return false;

      if (
        caregiverInfo.services === null ||
        caregiverInfo.availability === null ||
        caregiverInfo.timeZone === null ||
        caregiverInfo.hourlyRate === null ||
        caregiverInfo.description === null
      ) {
        return false;
      }

      if (
        caregiverInfo.workExperiences.length === 0 ||
        caregiverInfo.certificates.length === 0
      ) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}
