import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';

import { TokenGuard } from '../auth/middleware/auth.middleware';
import { AuthenticatedRequest } from '../auth/types/user.request.type';

import { PaymentAPiPath } from './enums/payment.api-path.enum';
import { PaymentService } from './payment.service';

@ApiTags('Payment')
@Controller(ApiPath.Payment)
@UseGuards(TokenGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiOperation({ summary: 'Withdraw balance' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Withdraw money from balance successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ErrorMessage.UserIsNotAuthorized,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  @Post(PaymentAPiPath.Withdraw)
  async withdrawBalance(
    @Body() updatedBalance: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }
    await this.paymentService.updateBalance(userId, updatedBalance);
  }

  @ApiOperation({ summary: 'Top-up balance' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top-up money to balance successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ErrorMessage.UserIsNotAuthorized,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  @Post(PaymentAPiPath.TopUp)
  async topUpBalance(
    @Body() updatedBalance: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }
    await this.paymentService.updateBalance(userId, updatedBalance);
  }
}
