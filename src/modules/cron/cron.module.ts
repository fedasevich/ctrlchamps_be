import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppointmentModule } from 'src/modules/appointment/appointment.module';

import { CronService } from './cron.service';

@Module({
  imports: [ScheduleModule.forRoot(), AppointmentModule],
  providers: [CronService],
})
export class CronModule {}
