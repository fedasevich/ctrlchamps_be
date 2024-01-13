import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { DefaultSeekerTask } from 'src/common/entities/default-seeker-task.entity';
import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { AllowedRoles } from 'src/decorators/roles-auth.decorator';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

import {
  DEFAULT_SEEKER_TASKS_EXAMPLE,
  DEFAULT_SEEKER_TASK_EXAMPLE,
} from './default-seeker-task.constants';
import { DefaultSeekerTaskService } from './default-seeker-task.service';
import {
  DefaultSeekerTaskQuery,
  DefaultSeekerTaskResponse,
} from './default-seeker-task.types';
import { CreateDefaultSeekerTaskDto } from './dto/create-default-seeker-task.dto';
import { UpdateDefaultSeekerTaskDto } from './dto/update-default-seeker-task.dto';
import { DefaultSeekerTaskApiPath } from './enums/default-seeker-task.api-path.enum';

@ApiTags('Default seeker task')
@UseGuards(TokenGuard)
@Controller(ApiPath.DefaultSeekerTask)
export class DefaultSeekerTaskController {
  constructor(
    private readonly defaultSeekerTaskService: DefaultSeekerTaskService,
  ) {}

  @ApiOperation({ summary: 'Default seeker task creating' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Default seeker task was created successfully',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.FailedCreateDefaultSeekerTask,
  })
  @Post(DefaultSeekerTaskApiPath.Root)
  @AllowedRoles(UserRole.Admin, UserRole.SuperAdmin)
  create(
    @Body() createDefaultSeekerTaskDto: CreateDefaultSeekerTaskDto,
  ): Promise<void> {
    return this.defaultSeekerTaskService.create(
      createDefaultSeekerTaskDto.name,
    );
  }

  @ApiOperation({ summary: 'Getting all default seeker tasks' })
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
    description: 'Search by efault seeker task name',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Default seeker tasks were sent successfully',
    schema: {
      example: DEFAULT_SEEKER_TASKS_EXAMPLE,
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  @Get(DefaultSeekerTaskApiPath.Root)
  findAll(
    @Query() query: DefaultSeekerTaskQuery,
  ): Promise<DefaultSeekerTaskResponse> {
    return this.defaultSeekerTaskService.findAll(query);
  }

  @Get(DefaultSeekerTaskApiPath.Id)
  @ApiOperation({ summary: 'Get one default seeker task' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Default seeker task info retrieved successfully',
    schema: {
      example: DEFAULT_SEEKER_TASK_EXAMPLE,
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
  findOne(@Param('id') id: string): Promise<DefaultSeekerTask> {
    return this.defaultSeekerTaskService.findById(id);
  }

  @ApiOperation({ summary: 'Update default seeker task name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Default seeker task name updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.FailedUpdateDefaultSeekerTask,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.DefaultSeekerTaskNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  @Patch(DefaultSeekerTaskApiPath.Id)
  @AllowedRoles(UserRole.Admin, UserRole.SuperAdmin)
  update(
    @Param('id') id: string,
    @Body() updateDefaultSeekerTaskDto: UpdateDefaultSeekerTaskDto,
  ): Promise<void> {
    return this.defaultSeekerTaskService.update(
      id,
      updateDefaultSeekerTaskDto.name,
    );
  }

  @ApiOperation({ summary: 'Delete default seeker task by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Default seeker task was deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.DefaultSeekerTaskNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.FailedDeleteDefaultSeekerTask,
  })
  @Delete(DefaultSeekerTaskApiPath.Id)
  @AllowedRoles(UserRole.Admin, UserRole.SuperAdmin)
  delete(@Param('id') id: string): Promise<void> {
    return this.defaultSeekerTaskService.delete(id);
  }
}
