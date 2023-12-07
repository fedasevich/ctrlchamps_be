import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { Repository } from 'typeorm';

@Injectable()
export class CaregiverInfoService {
  constructor(
    @InjectRepository(CaregiverInfo)
    private readonly caregiverInfoRepository: Repository<CaregiverInfo>,
  ) {}

  async findById(caregiverInfoId: string): Promise<CaregiverInfo> {
    try {
      return await this.caregiverInfoRepository
        .createQueryBuilder('caregiverInfoId')
        .where('caregiverInfoId.id = :caregiverInfoId', {
          caregiverInfoId,
        })
        .getOne();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.CaregiverInfoNotFound,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findUserByCaregiverInfoId(
    caregiverInfoId: string,
  ): Promise<CaregiverInfo> {
    try {
      return await this.caregiverInfoRepository
        .createQueryBuilder('caregiverInfoId')
        .innerJoinAndSelect('caregiverInfoId.user', 'user')
        .where('caregiverInfoId.id = :caregiverInfoId', {
          caregiverInfoId,
        })
        .getOne();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.UserNotExist,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
