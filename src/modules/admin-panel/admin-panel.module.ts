import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/common/entities/user.entity';
import { AuthModule } from 'src/modules/auth/auth.module';
import { EmailModule } from 'src/modules/email/email.module';
import { PasswordModule } from 'src/modules/update-password/update-password.module';
import { UserModule } from 'src/modules/users/user.module';

import { AdminPanelController } from './admin-panel.controller';
import { AdminPanelService } from './admin-panel.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    EmailModule,
    UserModule,
    PasswordModule,
    AuthModule,
  ],
  controllers: [AdminPanelController],
  providers: [AdminPanelService],
})
export class AdminPanelModule {}
