import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SeekerTask } from 'src/common/entities/seeker-task.entity';

import { SeekerTaskService } from './seeker-task.service';

@Module({
  imports: [TypeOrmModule.forFeature([SeekerTask])],
  providers: [SeekerTaskService],
  exports: [SeekerTaskService],
})
export class SeekerTaskModule {}
