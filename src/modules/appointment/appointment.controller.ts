import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Appointment } from 'src/common/entities/appointment.entity';
import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { AllowedRoles } from 'src/decorators/roles-auth.decorator';
import {
  APPOINTMENTS_EXAMPLE,
  APPOINTMENT_EXAMPLE,
} from 'src/modules/appointment/appointment.constants';
import { AppointmentService } from 'src/modules/appointment/appointment.service';
import { CreateAppointmentDto } from 'src/modules/appointment/dto/create-appointment.dto';
import { UpdateAppointmentDto } from 'src/modules/appointment/dto/update-appointment.dto';
import { AppointmentApiPath } from 'src/modules/appointment/enums/appointment.api-path.enum';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';
import { AuthenticatedRequest } from 'src/modules/auth/types/user.request.type';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

@ApiTags('Appointment')
@Controller(ApiPath.Appointment)
@UseGuards(TokenGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @ApiOperation({ summary: 'Appointment creating' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Appointment was created successfully',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.FailedCreateAppointment,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(AppointmentApiPath.Root)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<void> {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }

    await this.appointmentService.create(createAppointmentDto, userId);
  }

  @ApiOperation({ summary: 'Appointment updating' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Appointment was updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.AppointmentNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(AppointmentApiPath.AppointmentId)
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('appointmentId') appointmentId: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<void> {
    const { role } = req.user;
    await this.appointmentService.updateById(
      appointmentId,
      updateAppointmentDto,
      role,
    );
  }

  @ApiOperation({ summary: 'Appointment getting by Id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Appointment was sent successfully',
    schema: {
      example: APPOINTMENT_EXAMPLE,
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.AppointmentNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.FailedUpdateAppointment,
  })
  @Get(AppointmentApiPath.AppointmentId)
  async getOne(
    @Param('appointmentId') appointmentId: string,
  ): Promise<Appointment> {
    return this.appointmentService.findOneById(appointmentId);
  }

  @ApiOperation({ summary: 'All appointments getting' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Appointments were sent successfully',
    schema: {
      example: APPOINTMENTS_EXAMPLE,
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.AppointmentNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  @Get(AppointmentApiPath.Root)
  async getAll(@Req() req: AuthenticatedRequest): Promise<Appointment[]> {
    return this.appointmentService.findAllByUserId(req.user.id);
  }

  @ApiOperation({ summary: 'Getting all appointments by date' })
  @ApiParam({
    name: 'date',
    description: 'Date of appointment to search',
    required: true,
    type: 'Date',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Appointments were sent successfully',
    schema: {
      example: APPOINTMENTS_EXAMPLE,
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  @Get(AppointmentApiPath.Date)
  async getAllByDate(
    @Req() req: AuthenticatedRequest,
    @Param('date') date: string,
  ): Promise<Appointment[]> {
    return this.appointmentService.findAllByDate(req.user.id, date);
  }

  @ApiOperation({ summary: 'Delete the appointment by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Appointment was deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.UncompletedAppointmentDelete,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.AppointmentNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.FailedDeleteAppointment,
  })
  @AllowedRoles(UserRole.SuperAdmin, UserRole.Admin)
  @Delete(AppointmentApiPath.AppointmentId)
  async deleteOne(
    @Param('appointmentId') appointmentId: string,
  ): Promise<void> {
    await this.appointmentService.deleteById(appointmentId);
  }
}
