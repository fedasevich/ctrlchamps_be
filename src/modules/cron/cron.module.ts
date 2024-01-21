import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppointmentModule } from 'src/modules/appointment/appointment.module';
import { EmailModule } from 'src/modules/email/email.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { PaymentModule } from 'src/modules/payment/payment.module';
import { VirtualAssessmentModule } from 'src/modules/virtual-assessment/virtual-assessment.module';

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
