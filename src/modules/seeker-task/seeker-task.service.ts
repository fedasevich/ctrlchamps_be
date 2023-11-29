import { Injectable, HttpStatus, HttpException } from '@nestjs/common';

import { SeekerTask } from 'src/common/entities/seeker-task.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class SeekerTaskService {
  async createWithTransaction(
    transactionalEntityManager: EntityManager,
    appointmentId: string,
    name: string,
  ): Promise<void> {
    try {
      await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(SeekerTask)
        .values({ appointmentId, name })
        .execute();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
