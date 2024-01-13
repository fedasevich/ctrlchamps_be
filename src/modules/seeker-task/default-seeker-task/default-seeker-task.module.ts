import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DefaultSeekerTask } from 'src/common/entities/default-seeker-task.entity';

import { DefaultSeekerTaskController } from './default-seeker-task.controller';
import { DefaultSeekerTaskService } from './default-seeker-task.service';

@Module({
  imports: [TypeOrmModule.forFeature([DefaultSeekerTask])],
  controllers: [DefaultSeekerTaskController],
  providers: [DefaultSeekerTaskService],
})
export class DefaultSeekerTaskModule {}
