import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { AllowedRoles } from 'src/decorators/roles-auth.decorator';
import { AppointmentService } from 'src/modules/appointment/appointment.service';
import {
  AppointmentListResponse,
  AppointmentQuery,
} from 'src/modules/appointment/types/appointment.type';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

import { AdminPanelService } from './admin-panel.service';
import {
  ADMIN_DETAILS_EXAMPLE,
  FETCHED_ADMINS_EXAMPLE,
  FETCHED_APPOINTMENTS_EXAMPLE,
} from './constants/admin-panel.constants';
import { AdminCreateDto } from './dto/admin-create.dto';
import { AdminUpdateDto } from './dto/admin-update.dto';
import { PasswordUpdateDto } from './dto/password-update.dto';
import { AdminApiPath } from './enums/admin.api-path.enum';
import {
  AdminDetails,
  AdminListResponse,
  UserQuery,
} from './types/admin-panel.types';

@ApiTags('Admin Panel')
@UseGuards(TokenGuard)
@AllowedRoles(UserRole.SuperAdmin, UserRole.Admin)
@Controller(ApiPath.AdminPanel)
export class AdminPanelController {
  constructor(
    private readonly adminPanelService: AdminPanelService,
    private readonly appointmentService: AppointmentService,
  ) {}

  @Get(AdminApiPath.Admins)
  @AllowedRoles(UserRole.SuperAdmin)
  @ApiOperation({ summary: 'Get admins list' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of items to skip',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'search',
    description: 'Search by keyword (firstName/lastName or email)',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fetched admins list successfully',
    schema: {
      example: FETCHED_ADMINS_EXAMPLE,
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: ErrorMessage.ForbiddenResource,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  async getAdmins(@Query() query: UserQuery): Promise<AdminListResponse> {
    return this.adminPanelService.fetchAdmins(query);
  }

  @Get(AdminApiPath.Appointments)
  @ApiOperation({ summary: 'Get Appointment list' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of items to skip',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'name',
    description: 'Search by appointment name',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'sort',
    description: 'Sort by newest/oldest',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fetched appointments list successfully',
    schema: {
      example: FETCHED_APPOINTMENTS_EXAMPLE,
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: ErrorMessage.ForbiddenResource,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  async getAppointments(
    @Query() query: AppointmentQuery,
  ): Promise<AppointmentListResponse> {
    return this.appointmentService.findAll(query);
  }

  @Post()
  @AllowedRoles(UserRole.SuperAdmin)
  @ApiOperation({ summary: 'Create new admin' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Admin created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.UserEmailAlreadyExists,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async createAdmin(@Body() adminDto: AdminCreateDto): Promise<void> {
    return this.adminPanelService.createAdmin(adminDto);
  }

  @Patch(AdminApiPath.DetailedInfo)
  @AllowedRoles(UserRole.SuperAdmin)
  @ApiOperation({ summary: 'Update admin data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin data updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.FailedUpdateUser,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.UserProfileNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  async updateAdmin(
    @Param('adminId') adminId: string,
    @Body() adminInfo: AdminUpdateDto,
  ): Promise<void> {
    await this.adminPanelService.updateAdmin(adminId, adminInfo);
  }

  @Patch(`${AdminApiPath.UpdatePassword}${AdminApiPath.DetailedInfo}`)
  @AllowedRoles(UserRole.SuperAdmin)
  @ApiOperation({ summary: 'Update admin password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin password updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.FailedUpdateUser,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.UserProfileNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  async updateAdminPassword(
    @Param('adminId') adminId: string,
    @Body() passwordDto: PasswordUpdateDto,
  ): Promise<void> {
    await this.adminPanelService.updatePassword(adminId, passwordDto);
  }

  @Get(AdminApiPath.DetailedInfo)
  @ApiOperation({ summary: 'Get admin information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin detailed info retrieved successfully',
    schema: {
      example: ADMIN_DETAILS_EXAMPLE,
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.UserProfileNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  async getUserInfo(@Param('adminId') adminId: string): Promise<AdminDetails> {
    return this.adminPanelService.getAdminInfo(adminId);
  }
}
