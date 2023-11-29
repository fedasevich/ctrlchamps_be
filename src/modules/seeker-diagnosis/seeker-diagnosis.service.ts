import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { SeekerDiagnosis } from 'src/common/entities/seeker-diagnosis.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class SeekerDiagnosisService {
  async createWithTransaction(
    transactionalEntityManager: EntityManager,
    appointmentId: string,
    diagnosisId: string,
  ): Promise<void> {
    try {
      await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(SeekerDiagnosis)
        .values({
          appointmentId,
          diagnosisId,
        })
        .execute();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
