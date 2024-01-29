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
import { DATE_FORMAT, ZERO } from 'src/common/constants/date.constants';
import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { SeekerReview } from 'src/common/entities/seeker-reviews.entity';
import { User } from 'src/common/entities/user.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { Repository } from 'typeorm';

import { findNextDay } from '../payment/helpers/find-closest-day-to-date';

import { DetailedCaregiverInfo } from './types/detailed-caregiver-info.type';
import { FiltredCaregiver } from './types/filtred-caregiver.type';

@Injectable()
export class CaregiverInfoService {
  constructor(
    @InjectRepository(CaregiverInfo)
    private readonly caregiverInfoRepository: Repository<CaregiverInfo>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SeekerReview)
    private readonly seekerReviewRepository: Repository<SeekerReview>,
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
    isShowAvailableCaregivers: boolean,
    services?: string[],
    startTime?: Date,
    endTime?: Date,
    weekdays?: string[],
    ratings?: number[],
  ): Promise<FiltredCaregiver[]> {
    const formattedServices = services
      ? services.map((service) => `%${service}%`).join(',')
      : null;

    try {
      const queryBuilder = this.userRepository.createQueryBuilder('user');
      queryBuilder.innerJoin('user.caregiverInfo', 'caregiverInfo');

      queryBuilder.where('user.role = :role', { role: UserRole.Caregiver });
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

      queryBuilder.leftJoin('caregiverInfo.seekerReviews', 'seekerReviews');
      queryBuilder
        .select([
          'user.id',
          'user.firstName',
          'user.lastName',
          'caregiverInfo.hourlyRate',
          'caregiverInfo.availability',
        ])
        .addSelect('COALESCE(AVG(seekerReviews.rating), 0)', 'averageRating')
        .groupBy('user.id')
        .addGroupBy('user.firstName')
        .addGroupBy('user.lastName')
        .addGroupBy('caregiverInfo.hourlyRate')
        .having(ratings ? 'FLOOR(averageRating) IN (:...ratings)' : '1=1', {
          ratings,
        })
        .orderBy('averageRating', 'DESC');

      if (isShowAvailableCaregivers) {
        const caregiversWithAppointments =
          await this.appointmentService.findAppointmentsByTimeRange(
            startTime,
            endTime,
            weekdays,
          );

        const caregiverIdsWithAppointments = caregiversWithAppointments.map(
          (appointment) => appointment.caregiverInfoId,
        );

        if (caregiverIdsWithAppointments.length) {
          queryBuilder.andWhere(
            'caregiverInfo.id NOT IN (:...caregiverIdsWithAppointments)',
            {
              caregiverIdsWithAppointments,
            },
          );
        }

        let dayOfWeek: string;
        const startTimeISO = parseISO(startTime!.toISOString());
        const endTimeISO = parseISO(endTime!.toISOString());

        if (weekdays && weekdays.length) {
          weekdays.forEach((day) => {
            queryBuilder.andWhere(`caregiverInfo.availability LIKE :${day}`, {
              [day]: `%"day": "${day}"%`,
            });
          });

          dayOfWeek = findNextDay(startTime, weekdays);
        } else {
          dayOfWeek = format(startTime, 'EEEE');
          queryBuilder.andWhere(
            'caregiverInfo.availability LIKE :availability',
            {
              availability: `%"day": "${dayOfWeek}"%`,
            },
          );
        }

        const caregivers = await queryBuilder.getRawMany();

        const filteredCaregivers = caregivers.filter((caregiver) => {
          const { caregiverInfo_availability: availability } = caregiver;

          if (availability) {
            const dayAvailability = availability.find(
              (slot) => weekdays?.includes(slot.day) ?? dayOfWeek === slot.day,
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
          id: user.user_id,
          firstName: user.user_firstName,
          lastName: user.user_lastName,
          hourlyRate: user.caregiverInfo_hourlyRate,
          averageRating: parseFloat(user.averageRating).toFixed(1),
        }));
      }

      const caregivers = await queryBuilder.getRawMany();

      return caregivers.map((user) => ({
        id: user.user_id,
        firstName: user.user_firstName,
        lastName: user.user_lastName,
        hourlyRate: user.caregiverInfo_hourlyRate,
        averageRating: parseFloat(user.averageRating).toFixed(1),
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

        .leftJoinAndSelect('caregiverInfo.seekerReviews', 'seekerReviews')
        .leftJoin('seekerReviews.user', 'seekerReviewUser')
        .addSelect([
          'seekerReviewUser.id',
          'seekerReviewUser.lastName',
          'seekerReviewUser.firstName',
          'seekerReviewUser.avatar',
        ])

        .where('user.id = :userId', { userId })
        .getOne();

      const count = await this.appointmentService.findAppointmentsCountById(
        userInfo.caregiverInfo.id,
      );

      const averageRating = await this.seekerReviewRepository.average(
        'rating',
        {
          caregiverInfoId: userInfo.caregiverInfo.id,
        },
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
        seekerReviews: userInfo.caregiverInfo.seekerReviews,
        averageRating: averageRating
          ? averageRating.toFixed(1)
          : ZERO.toFixed(1),
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
