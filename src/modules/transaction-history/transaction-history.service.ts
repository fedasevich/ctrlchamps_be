import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { TransactionHistory } from 'src/common/entities/transaction-history.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { EntityManager, Repository } from 'typeorm';

import { AppointmentService } from '../appointment/appointment.service';
import { UserService } from '../users/user.service';

import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './types/transaction-history.type';

@Injectable()
export class TransactionHistoryService {
  constructor(
    @InjectRepository(TransactionHistory)
    private readonly transactionHistoryRepository: Repository<TransactionHistory>,
    private readonly userService: UserService,
    @Inject(forwardRef(() => AppointmentService))
    private appointmentService: AppointmentService,
  ) {}

  async getTransactionHistory(userId: string): Promise<Transaction[]> {
    try {
      const transactions = await this.transactionHistoryRepository
        .createQueryBuilder('transactions')
        .where('user.id = :userId', {
          userId,
        })
        .getMany();

      return transactions;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async create(
    transaction: CreateTransactionDto,
    transactionalEntityManager?: EntityManager,
  ): Promise<void> {
    try {
      const user = await this.userService.findById(transaction.userId);

      if (!user) {
        throw new HttpException(
          ErrorMessage.UserIsNotAuthorized,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (transaction.appointmentId) {
        const appointment = await this.appointmentService.findOneById(
          transaction.appointmentId,
        );

        if (!appointment) {
          throw new HttpException(
            ErrorMessage.AppointmentNotFound,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const repository =
        transactionalEntityManager ?? this.transactionHistoryRepository;

      await repository
        .createQueryBuilder()
        .insert()
        .into(TransactionHistory)
        .values(transaction)
        .execute();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
