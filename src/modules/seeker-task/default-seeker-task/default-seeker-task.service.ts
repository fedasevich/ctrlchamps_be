import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { DefaultSeekerTask } from 'src/common/entities/default-seeker-task.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { Repository } from 'typeorm';

import { PAGINATION_LIMIT } from './default-seeker-task.constants';
import {
  DefaultSeekerTaskQuery,
  DefaultSeekerTaskResponse,
} from './default-seeker-task.types';

@Injectable()
export class DefaultSeekerTaskService {
  constructor(
    @InjectRepository(DefaultSeekerTask)
    private readonly defaultSeekerTaskRepository: Repository<DefaultSeekerTask>,
  ) {}

  async create(name: string): Promise<void> {
    try {
      await this.defaultSeekerTaskRepository
        .createQueryBuilder()
        .insert()
        .into(DefaultSeekerTask)
        .values({
          name,
        })
        .execute();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedCreateDefaultSeekerTask,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    query: DefaultSeekerTaskQuery = {},
  ): Promise<DefaultSeekerTaskResponse> {
    try {
      const limit = query.limit || PAGINATION_LIMIT;
      const offset = query.offset || 0;
      const search = query.search || '';

      const [result, total] = await this.defaultSeekerTaskRepository
        .createQueryBuilder('defaultSeekerTask')
        .where(`(defaultSeekerTask.name LIKE :name )`, {
          name: `%${search}%`,
        })
        .take(limit)
        .skip(offset)
        .orderBy('defaultSeekerTask.createdAt', 'DESC')
        .getManyAndCount();

      return {
        data: result,
        count: total,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findById(id: string): Promise<DefaultSeekerTask> {
    try {
      const defaultSeekerTask = await this.defaultSeekerTaskRepository
        .createQueryBuilder('defaultSeekerTask')
        .where('defaultSeekerTask.id = :id', {
          id,
        })
        .getOne();

      if (!defaultSeekerTask) {
        throw new HttpException(
          ErrorMessage.DefaultSeekerTaskNotFound,
          HttpStatus.BAD_REQUEST,
        );
      }

      return defaultSeekerTask;
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.BAD_REQUEST
      ) {
        throw error;
      }

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: string, name: string): Promise<void> {
    try {
      await this.findById(id);

      await this.defaultSeekerTaskRepository
        .createQueryBuilder()
        .update(DefaultSeekerTask)
        .set({ name })
        .where('default_seeker_task.id = :id', {
          id,
        })
        .execute();
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedUpdateDefaultSeekerTask,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const defaultSeekerTask = await this.findById(id);

      if (!defaultSeekerTask) {
        throw new HttpException(
          ErrorMessage.DefaultSeekerTaskNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.defaultSeekerTaskRepository
        .createQueryBuilder()
        .delete()
        .from(DefaultSeekerTask)
        .where('id = :id', { id })
        .execute();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
