import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { SeekerActivity } from 'src/common/entities/seeker-activity.entity';
import { ActivityAnswer } from 'src/modules/seeker-activity/enums/activity-answer.enum';
import { Repository } from 'typeorm';

@Injectable()
export class SeekerActivityService {
  constructor(
    @InjectRepository(SeekerActivity)
    private readonly seekerActivityRepository: Repository<SeekerActivity>,
  ) {}

  async create(
    appointmentId: string,
    activityId: string,
    answer: ActivityAnswer,
  ): Promise<void> {
    try {
      await this.seekerActivityRepository
        .createQueryBuilder()
        .insert()
        .into(SeekerActivity)
        .values({
          appointmentId,
          activityId,
          answer,
        })
        .execute();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
