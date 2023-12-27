import {
  Controller,
  Post,
  Body,
  HttpStatus,
  UseGuards,
  Patch,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { ActivityLogApiPath } from 'src/modules/activity-log/enums/activity-log.api-path.enum';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';

import { ActivityLogService } from './activity-log.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';

@ApiTags('Activity Log')
@UseGuards(TokenGuard)
@Controller(ApiPath.ActivityLog)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @ApiOperation({ summary: 'Activity log creating' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Activity log was created successfully',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.FailedCreateActivityLog,
  })
  @Post(ActivityLogApiPath.Root)
  async create(
    @Body() createActivityLogDto: CreateActivityLogDto,
  ): Promise<void> {
    await this.activityLogService.create(createActivityLogDto);
  }

  @ApiOperation({ summary: 'Update Activity log status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Activity log was updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.FailedUpdateActivityLogStatus,
  })
  @Patch(ActivityLogApiPath.SingleActivityLog)
  async updateStatusActivityLog(
    @Param('activityLogId') activityLogId: string,
    @Body() updateActivityLogDto: UpdateActivityLogDto,
  ): Promise<void> {
    await this.activityLogService.updateStatusActivityLog(
      activityLogId,
      updateActivityLogDto,
    );
  }
}
