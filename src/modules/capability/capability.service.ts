import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Capability } from 'src/common/entities/capability.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { Repository } from 'typeorm';

@Injectable()
export class CapabilityService {
  constructor(
    @InjectRepository(Capability)
    private readonly capabilityRepository: Repository<Capability>,
  ) {}

  findAll(): Promise<Capability[]> {
    try {
      return this.capabilityRepository.createQueryBuilder().getMany();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedSendCapabilities,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
