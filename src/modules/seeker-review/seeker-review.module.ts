import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from 'src/common/entities/appointment.entity';
import { SeekerReview } from 'src/common/entities/seeker-reviews.entity';
import { AppointmentModule } from 'src/modules/appointment/appointment.module';
import { EmailModule } from 'src/modules/email/email.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { UserModule } from 'src/modules/users/user.module';

import { SeekerReviewController } from './seeker-review.controller';
import { SeekerReviewService } from './seeker-review.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SeekerReview, Appointment]),
    NotificationModule,
    EmailModule,
    AppointmentModule,
    UserModule,
  ],
  controllers: [SeekerReviewController],
  providers: [SeekerReviewService],
  exports: [SeekerReviewService],
})
export class SeekerReviewModule {}
