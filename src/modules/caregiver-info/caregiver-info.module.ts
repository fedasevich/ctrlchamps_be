import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { User } from 'src/common/entities/user.entity';

import { AppointmentService } from '../appointment/appointment.service';
import { ProfileModule } from '../profile/profile.module';
import { UserService } from '../users/user.service';

import { CaregiverInfoController } from './caregiver-info.controller';
import { CaregiverInfoService } from './caregiver-info.service';
import { AppointmentModule } from '../appointment/appointment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CaregiverInfo]),
    ProfileModule,
    forwardRef(() => AppointmentModule),
  ],
  controllers: [CaregiverInfoController],
  providers: [CaregiverInfoService, UserService],
  exports: [CaregiverInfoService, UserService],
})
export class CaregiverInfoModule {}
