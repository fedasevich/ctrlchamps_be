import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';

import { NOTIFICATION_HISTORY_EXAMPLE } from './constants/notification.constants';
import { NotificationApiPath } from './enums/notification.api-path.enum';
import { NotificationService } from './notification.service';
import { NotificationsListResponse } from './types/notification.type';

@ApiTags('Notifications')
@Controller(ApiPath.Notifications)
@UseGuards(TokenGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({ summary: "Get all user's notifications" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification were sent successfully',
    schema: {
      example: NOTIFICATION_HISTORY_EXAMPLE,
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.UserIsNotAuthorized,
  })
  @Get(NotificationApiPath.UserId)
  getNotificationsHistory(
    @Param('userId') userId: string,
  ): Promise<NotificationsListResponse> {
    return this.notificationService.getNotifications(userId);
  }
}
