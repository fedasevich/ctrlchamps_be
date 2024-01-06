import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { User } from 'src/common/entities/user.entity';
import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { AllowedRoles } from 'src/decorators/roles-auth.decorator';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

import { AdminPanelService } from './admin-panel.service';
import { FETCHED_ADMINS_EXAMPLE } from './constants/admin-panel.constants';
import { AdminApiPath } from './enums/admin.api-path.enum';
import { UserQuery } from './types/admin-panel.types';

@ApiTags('Admin Panel')
@UseGuards(TokenGuard)
@AllowedRoles(UserRole.SuperAdmin, UserRole.Admin)
@Controller(ApiPath.AdminPanel)
export class AdminPanelController {
  constructor(private readonly adminPanelService: AdminPanelService) {}

  @Get(AdminApiPath.GetAdmins)
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
    name: 'name',
    description: 'Search by name (firstName or lastName)',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'email',
    description: 'Search by email',
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
  async getAdmins(
    @Query() query: UserQuery,
  ): Promise<{ data: User[]; count: number }> {
    return this.adminPanelService.fetchAdmins(query);
  }
}
