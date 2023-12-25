import {
  Controller,
  Get,
  Patch,
  HttpStatus,
  Param,
  UseGuards,
  Body,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { User } from 'src/common/entities/user.entity';
import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';
import { AuthenticatedRequest } from 'src/modules/auth/types/user.request.type';

import {
  MAX_FILE_SIZE,
  USER_INFO_EXAMPLE,
} from './constants/user-info.constants';
import { UpdatePasswordDto } from './dto/update-password.dto';
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

  @Patch(UserApiPath.ChangePassword)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User password changed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.InvalidProvidedPassword,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.UserProfileNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  async updateUserPassword(
    @Param('userId') userId: string,
    @Body() passwordData: UpdatePasswordDto,
  ): Promise<void> {
    await this.userService.updatePassword(userId, passwordData);
  }

  @Post(UserApiPath.UploadAvatar)
  @ApiOperation({ summary: 'Upload avatar for user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Avatar uploaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.BacketNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: '.(png|jpeg|heic)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }
    await this.userService.uploadAvatar(file.originalname, file.buffer, userId);
  }
}
