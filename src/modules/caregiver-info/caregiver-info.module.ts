import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';

import { CaregiverInfoService } from './caregiver-info.service';

@Module({
  imports: [TypeOrmModule.forFeature([CaregiverInfo])],
  providers: [CaregiverInfoService],
  exports: [CaregiverInfoService],
})
export class CaregiverInfoModule {}
