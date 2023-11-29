import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

import { SeekerActivity } from 'src/common/entities/seeker-activity.entity';
import { ActivityAnswer } from 'src/modules/seeker-activity/enums/activity-answer.enum';
import { EntityManager } from 'typeorm';

@Injectable()
export class SeekerActivityService {
  async createWithTransaction(
    transactionalEntityManager: EntityManager,
    appointmentId: string,
    activityId: string,
    answer: ActivityAnswer,
  ): Promise<void> {
    try {
      await transactionalEntityManager
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
