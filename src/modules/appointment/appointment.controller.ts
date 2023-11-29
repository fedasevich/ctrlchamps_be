import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { RequestWithUser } from 'src/common/types/request-with-user.type';
import { AppointmentService } from 'src/modules/appointment/appointment.service';
import { CreateAppointmentDto } from 'src/modules/appointment/dto/create-appointment.dto';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';

@Controller('appointment')
@UseGuards(TokenGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @ApiOperation({ summary: 'Appointment creating' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Appointment was created successfully',
  })
  // @ApiResponse({
  //   status: HttpStatus.BAD_REQUEST,
  //   description: ErrorMessage.OtpCodeIncorrect,
  // })
  // @ApiResponse({
  //   status: HttpStatus.BAD_REQUEST,
  //   description: ErrorMessage.UserAlreadyVerified,
  // })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('')
  async create(
    @Req() req: RequestWithUser,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<void> {
    await this.appointmentService.create(createAppointmentDto, req.user.id);
  }
}
