import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivityLog } from 'src/common/entities/activity-log.entity';

import { AdminPanelModule } from '../admin-panel/admin-panel.module';
import { EmailModule } from '../email/email.module';
import { NotificationModule } from '../notification/notification.module';

import { ActivityLogController } from './activity-log.controller';
import { ActivityLogService } from './activity-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLog]),
    NotificationModule,
    AdminPanelModule,
    EmailModule,
  ],
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
