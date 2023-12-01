import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { User } from 'src/common/entities/user.entity';

import { ProfileModule } from '../profile/profile.module';
import { UserService } from '../users/user.service';

import { CaregiverInfoController } from './caregiver-info.controller';
import { CaregiverInfoService } from './caregiver-info.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, CaregiverInfo]), ProfileModule],
  controllers: [CaregiverInfoController],
  providers: [CaregiverInfoService, UserService],
  exports: [CaregiverInfoService, UserService],
})
export class CaregiverInfoModule {}
