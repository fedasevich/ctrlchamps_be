import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { SeekerTask } from 'src/common/entities/seeker-task.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeekerTaskService {
  constructor(
    @InjectRepository(SeekerTask)
    private readonly seekerTaskRepository: Repository<SeekerTask>,
  ) {}

  async create(appointmentId: string, name: string): Promise<void> {
    try {
      await this.seekerTaskRepository
        .createQueryBuilder()
        .insert()
        .into(SeekerTask)
        .values({
          appointmentId,
          name,
        })
        .execute();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
