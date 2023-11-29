import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { SeekerDiagnosis } from 'src/common/entities/seeker-diagnosis.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeekerDiagnosisService {
  constructor(
    @InjectRepository(SeekerDiagnosis)
    private readonly seekerDiagnosisRepository: Repository<SeekerDiagnosis>,
  ) {}

  async create(appointmentId: string, diagnosisId: string): Promise<void> {
    try {
      await this.seekerDiagnosisRepository
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
