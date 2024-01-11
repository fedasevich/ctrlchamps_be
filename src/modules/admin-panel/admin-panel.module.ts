import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/common/entities/user.entity';
import { AppointmentModule } from 'src/modules/appointment/appointment.module';
import { EmailModule } from 'src/modules/email/email.module';

import { AdminPanelController } from './admin-panel.controller';
import { AdminPanelService } from './admin-panel.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AppointmentModule, EmailModule],
  controllers: [AdminPanelController],
  providers: [AdminPanelService],
})
export class AdminPanelModule {}
