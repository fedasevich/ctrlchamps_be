import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SeekerActivity } from 'src/common/entities/seeker-activity.entity';

import { SeekerActivityService } from './seeker-activity.service';

@Module({
  imports: [TypeOrmModule.forFeature([SeekerActivity])],
  providers: [SeekerActivityService],
  exports: [SeekerActivityService],
})
export class SeekerActivityModule {}
