import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/common/entities/user.entity';

import { PasswordService } from './update-password.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [PasswordService],
  exports: [PasswordService],
})
export class PasswordModule {}
