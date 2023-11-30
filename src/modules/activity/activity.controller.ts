import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Activity } from 'src/common/entities/activity.entity';
import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { ActivityApiPath } from 'src/modules/activity/enums/activity.api-path.enum';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';

import { ActivityService } from './activity.service';

@ApiTags('Activity')
@Controller(ApiPath.Activity)
@UseGuards(TokenGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @ApiOperation({ summary: 'Get all activities' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Activities were sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.FailedSendActivities,
  })
  @Get(ActivityApiPath.Root)
  findAll(): Promise<Activity[]> {
    return this.activityService.findAll();
  }
}
