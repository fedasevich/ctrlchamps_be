import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Diagnosis } from 'src/common/entities/diagnosis.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { Repository } from 'typeorm';

@Injectable()
export class DiagnosisService {
  constructor(
    @InjectRepository(Diagnosis)
    private readonly diagnosisRepository: Repository<Diagnosis>,
  ) {}

  findAll(): Promise<Diagnosis[]> {
    try {
      return this.diagnosisRepository.createQueryBuilder().getMany();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedSendDiagnoses,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
