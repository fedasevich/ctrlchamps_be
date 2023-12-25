import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ActivityLog } from 'src/common/entities/activity-log.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { Repository } from 'typeorm';

import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async create(activityLog: CreateActivityLogDto): Promise<void> {
    try {
      const { tasks, ...rest } = activityLog;

      await this.activityLogRepository
        .createQueryBuilder()
        .insert()
        .into(ActivityLog)
        .values({
          ...rest,
          tasks: JSON.stringify(tasks),
        })
        .execute();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedCreateActivityLog,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateStatusActivityLog(
    activityLogId: string,
    updateActivityLogDto: UpdateActivityLogDto,
  ): Promise<void> {
    try {
      await this.activityLogRepository.update(
        { id: activityLogId },
        { ...updateActivityLogDto },
      );
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedUpdateActivityLogStatus,
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
