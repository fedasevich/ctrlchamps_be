import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { Certificate } from 'src/common/entities/certificate.entity';
import { User } from 'src/common/entities/user.entity';
import { WorkExperience } from 'src/common/entities/work-experience.entity';

import { UserService } from '../users/user.service';
import { CaregiverController } from './caregiver.controller';
import { CaregiverService } from './caregiver.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, CaregiverInfo])],
  controllers: [CaregiverController],
  providers: [CaregiverService, UserService],
})
export class CaregiverModule {}
