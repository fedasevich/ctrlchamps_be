import {
  Controller,
  Get,
  Patch,
  HttpStatus,
  Param,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { User } from 'src/common/entities/user.entity';
import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';

import { USER_INFO_EXAMPLE } from './constants/user-info.constants';
import { UserUpdateDto } from './dto/user-update-info.dto';
import { UserApiPath } from './enums/user.api-path.enum';
import { UserService } from './user.service';

@ApiTags('User')
@Controller(ApiPath.User)
@UseGuards(TokenGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(UserApiPath.DetailedInfo)
  @ApiOperation({ summary: 'Get user information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User detailed info retrieved successfully',
    schema: {
      example: USER_INFO_EXAMPLE,
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
  async getUserInfo(@Param('userId') userId: string): Promise<User> {
    return this.userService.getUserInfo(userId);
  }

  @Patch(UserApiPath.DetailedInfo)
  @ApiOperation({ summary: 'Update user data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User data updated successfully',
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
  async updateProfile(
    @Param('userId') userId: string,
    @Body() userInfo: UserUpdateDto,
  ): Promise<void> {
    await this.userService.updateUserInfo(userId, userInfo);
  }
}
