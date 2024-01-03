import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';

import { TokenGuard } from '../auth/middleware/auth.middleware';

import { TRANSACTIONS_HISTORY_EXAMPLE } from './constants/transaction-history.constants';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionApiPath } from './enums/transaction-api-path.enum';
import { PaymentService } from './payment.service';
import { Transaction } from './types/transaction-history.type';

@ApiTags('Transaction History')
@Controller(ApiPath.TransactionHistory)
@UseGuards(TokenGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiOperation({ summary: 'Transactions history getting by user Id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transactions history retrieved successfully',
    schema: {
      example: TRANSACTIONS_HISTORY_EXAMPLE,
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.UserIsNotAuthorized,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  @Get(TransactionApiPath.UserId)
  async getTransactionHistory(
    @Param('userId') userId: string,
  ): Promise<Transaction[]> {
    return this.paymentService.getTransactionHistory(userId);
  }

  @ApiOperation({ summary: 'Transactions creating' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Transaction was created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.FailedCreateTransaction,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  @Post()
  async createTransaction(
    @Body() transaction: CreateTransactionDto,
  ): Promise<void> {
    return this.paymentService.createTransaction(transaction);
  }
}
