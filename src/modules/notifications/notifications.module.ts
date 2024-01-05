import { Module } from '@nestjs/common';

import { UserModule } from '../users/user.module';

import { NotificationsService } from './notifications.service';

@Module({
  imports: [UserModule],
  providers: [NotificationsService],
})
export class NotificationsModule {}
