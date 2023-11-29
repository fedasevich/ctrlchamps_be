import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { SeekerCapability } from 'src/common/entities/seeker-capability.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeekerCapabilityService {
  constructor(
    @InjectRepository(SeekerCapability)
    private readonly seekerDiagnosisRepository: Repository<SeekerCapability>,
  ) {}

  async create(appointmentId: string, capabilityId: string): Promise<void> {
    try {
      await this.seekerDiagnosisRepository
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
