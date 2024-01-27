import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { subDays } from 'date-fns';
import { ONE_DAY } from 'src/common/constants/constants';
import { ZERO } from 'src/common/constants/date.constants';
import { Appointment } from 'src/common/entities/appointment.entity';
import { SeekerReview } from 'src/common/entities/seeker-reviews.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { AppointmentStatus } from 'src/modules/appointment/enums/appointment-status.enum';
import { EmailService } from 'src/modules/email/services/email.service';
import {
  DEFAULT_OFFSET,
  DEFAULT_PAGINATION_LIMIT,
} from 'src/modules/seeker-review/seeker-review.constants';
import { ReviewQuery } from 'src/modules/seeker-review/types/review-query.type';
import { ReviewsByUserId } from 'src/modules/seeker-review/types/reviews-by-user-id.type';
import { UserService } from 'src/modules/users/user.service';
import { Repository } from 'typeorm';

import { CreateSeekerReviewDto } from './dto/create-seeker-review.dto';

@Injectable()
export class SeekerReviewService {
  private readonly caregiverNewReviewTemplateId =
    this.configService.get<string>('SENDGRID_NEW_SEEKER_REVIEW_TEMPLATE_ID');

  constructor(
    @InjectRepository(SeekerReview)
    private readonly seekerReviewRepository: Repository<SeekerReview>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
  ) {}

  async create(
    createSeekerReviewDto: CreateSeekerReviewDto,
    userId: string,
  ): Promise<void> {
    try {
      const { caregiverInfoId, rating, review } = createSeekerReviewDto;

      const oneDayAgo = subDays(new Date(), ONE_DAY);

      oneDayAgo.setMilliseconds(ZERO);
      oneDayAgo.setSeconds(ZERO);

      const userAppointmentsWithCaregiverInfo = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.endDate <= :oneDayAgo', { oneDayAgo })
        .andWhere('appointment.userId = :userId', { userId })
        .andWhere('appointment.caregiverInfoId = :caregiverInfoId', {
          caregiverInfoId,
        })
        .andWhere(
          'appointment.status = :finished OR appointment.status = :completed',
          {
            finished: AppointmentStatus.Finished,
            completed: AppointmentStatus.Completed,
          },
        )
        .innerJoinAndSelect('appointment.user', 'appointmentUser')
        .innerJoinAndSelect('appointment.caregiverInfo', 'caregiverInfo')
        .innerJoinAndSelect('caregiverInfo.user', 'caregiverInfoUser')
        .getMany();

      if (!userAppointmentsWithCaregiverInfo.length) {
        throw new HttpException(
          ErrorMessage.UserNotHaveAppointmentWithCaregiverInfo,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.seekerReviewRepository
        .createQueryBuilder()
        .insert()
        .into(SeekerReview)
        .values({
          userId,
          caregiverInfoId,
          rating,
          review,
        })
        .execute();

      const selectedAppointment = userAppointmentsWithCaregiverInfo[ZERO];

      await this.emailService.sendEmail({
        to: selectedAppointment.caregiverInfo.user.email,
        templateId: this.caregiverNewReviewTemplateId,
        dynamicTemplateData: {
          caregiverName: `${selectedAppointment.caregiverInfo.user.firstName} ${selectedAppointment.caregiverInfo.user.lastName}`,
          seekerName: `${selectedAppointment.user.firstName} ${selectedAppointment.user.lastName}`,
          seekerReview: createSeekerReviewDto.review,
          seekerRating: createSeekerReviewDto.rating,
        },
      });
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedCreateSeekerReview,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findById(id: string): Promise<SeekerReview> {
    try {
      const seekerReview = await this.seekerReviewRepository
        .createQueryBuilder('seekerReview')
        .where('seekerReview.id = :id', {
          id,
        })
        .getOne();

      if (!seekerReview) {
        throw new HttpException(
          ErrorMessage.SeekerReviewNotFound,
          HttpStatus.BAD_REQUEST,
        );
      }

      return seekerReview;
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const seekerReview = await this.findById(id);

      if (!seekerReview) {
        throw new HttpException(
          ErrorMessage.SeekerReviewNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.seekerReviewRepository
        .createQueryBuilder()
        .delete()
        .from(SeekerReview)
        .where('id = :id', { id })
        .execute();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedDeleteSeekerReview,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAverageRating(caregiverInfoId: string): Promise<number> {
    const average = await this.seekerReviewRepository.average('rating', {
      caregiverInfoId,
    });

    return average;
  }

  async getAllByUserId(
    { limit = DEFAULT_PAGINATION_LIMIT, offset = DEFAULT_OFFSET }: ReviewQuery,
    userId: string,
  ): Promise<ReviewsByUserId> {
    try {
      const { caregiverInfo } =
        await this.userService.findCaregiverInfoByUserId(userId);

      const [data, count] = await this.seekerReviewRepository
        .createQueryBuilder('seekerReviews')
        .where('seekerReviews.caregiverInfoId = :caregiverInfoId', {
          caregiverInfoId: caregiverInfo.id,
        })
        .select([
          'seekerReviews.id',
          'seekerReviews.rating',
          'seekerReviews.review',
          'seekerReviews.createdAt',
          'seekerReviews.caregiverInfoId',
        ])
        .innerJoin('seekerReviews.user', 'seekerReviewUser')
        .addSelect([
          'seekerReviewUser.id',
          'seekerReviewUser.lastName',
          'seekerReviewUser.firstName',
          'seekerReviewUser.avatar',
        ])
        .take(limit)
        .skip(offset)
        .orderBy('seekerReviews.createdAt', 'DESC')
        .getManyAndCount();

      return {
        data,
        count,
      };
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedFetchReviews,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
