import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Activity } from 'src/common/entities/activity.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { Repository } from 'typeorm';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  findAll(): Promise<Activity[]> {
    try {
      return this.activityRepository.createQueryBuilder().getMany();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedSendActivities,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
