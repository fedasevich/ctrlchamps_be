import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionHistory } from 'src/common/entities/transaction-history.entity';

import { AppointmentModule } from '../appointment/appointment.module';
import { UserModule } from '../users/user.module';

import { TransactionHistoryController } from './transaction-history.controller';
import { TransactionHistoryService } from './transaction-history.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionHistory]),
    UserModule,
    forwardRef(() => AppointmentModule),
  ],
  controllers: [TransactionHistoryController],
  providers: [TransactionHistoryService],
  exports: [TransactionHistoryService],
})
export class TransactionHistoryModule {}
