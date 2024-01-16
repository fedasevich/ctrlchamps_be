import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppointmentModule } from 'src/modules/appointment/appointment.module';
import { EmailModule } from 'src/modules/email/email.module';

import { NotificationModule } from '../notification/notification.module';
import { PaymentModule } from '../payment/payment.module';
import { VirtualAssessmentModule } from '../virtual-assessment/virtual-assessment.module';

import { CronService } from './cron.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AppointmentModule,
    PaymentModule,
    VirtualAssessmentModule,
    NotificationModule,
    EmailModule,
  ],

  providers: [CronService],
})
export class CronModule {}
