import {
  Body,
  Controller,
  HttpStatus,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';

import { TokenGuard } from '../auth/middleware/auth.middleware';
import { AuthenticatedRequest } from '../auth/types/user.request.type';

import { PaymentService } from './payment.service';

@ApiTags('Transactions')
@Controller(ApiPath.Transactions)
@UseGuards(TokenGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiOperation({ summary: 'Top-up / Withdraw balance' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Updated balance successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ErrorMessage.UserIsNotAuthorized,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  @Patch()
  async topUpBalance(
    @Body() { balance }: { balance: number },
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }
    await this.paymentService.updateBalance(userId, balance);
  }
}
