import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PasswordModule } from 'modules/update-password/update-password.module';
import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { SeekerReview } from 'src/common/entities/seeker-reviews.entity';
import { User } from 'src/common/entities/user.entity';
import { AppointmentModule } from 'src/modules/appointment/appointment.module';
import { EmailModule } from 'src/modules/email/email.module';
import { ProfileModule } from 'src/modules/profile/profile.module';
import { UserService } from 'src/modules/users/user.service';

import { CaregiverInfoController } from './caregiver-info.controller';
import { CaregiverInfoService } from './caregiver-info.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CaregiverInfo, SeekerReview]),
    ProfileModule,
    PasswordModule,
    EmailModule,
    forwardRef(() => AppointmentModule),
  ],
  controllers: [CaregiverInfoController],
  providers: [CaregiverInfoService, UserService],
  exports: [CaregiverInfoService],
})
export class CaregiverInfoModule {}
