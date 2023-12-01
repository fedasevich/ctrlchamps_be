import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

import { SeekerCapability } from 'src/common/entities/seeker-capability.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class SeekerCapabilityService {
  async createWithTransaction(
    transactionalEntityManager: EntityManager,
    appointmentId: string,
    capabilityId: string,
  ): Promise<void> {
    try {
      await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(SeekerCapability)
        .values({
          appointmentId,
          capabilityId,
        })
        .execute();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
