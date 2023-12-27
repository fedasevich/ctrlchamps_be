import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppointmentModule } from 'src/modules/appointment/appointment.module';

import { PaymentModule } from '../payment/payment.module';
import { VirtualAssessmentModule } from '../virtual-assessment/virtual-assessment.module';

import { CronService } from './cron.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AppointmentModule,
    PaymentModule,
    VirtualAssessmentModule,
  ],

  providers: [CronService],
})
export class CronModule {}
