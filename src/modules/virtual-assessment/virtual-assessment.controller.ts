import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpStatus,
  Req,
  UnauthorizedException,
  UseGuards,
  Patch,
  Res,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

import { Response } from 'express';
import { VirtualAssessment } from 'src/common/entities/virtual-assessment.entity';
import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { VirtualAssessmentStatus } from 'src/common/enums/virtual-assessment.enum';
import { AccessWithoutToken } from 'src/decorators/access-granted.decorator';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';
import { AuthenticatedRequest } from 'src/modules/auth/types/user.request.type';

import { VIRTUAL_ASSESSMENT_GET_EXAMPLE } from './constants/virtual-assessment.constant';
import { RescheduleVirtualAssessmentDto } from './dto/reschedule-assessment.dto';
import { UpdateVirtualAssessmentStatusDto } from './dto/update-status.dto';
import { CreateVirtualAssessmentDto } from './dto/virtual-assessment.dto';
import { VirtualAssessmentApiPath } from './enums/virtual-assessment-path.enum';
import { VirtualAssessmentService } from './virtual-assessment.service';

@ApiTags('Appointment')
@Controller(ApiPath.Appointment)
@UseGuards(TokenGuard)
export class VirtualAssessmentController {
  constructor(
    private readonly virtualAssessmentService: VirtualAssessmentService,
    private readonly configService: ConfigService,
  ) {}

  @Get(VirtualAssessmentApiPath.SingleVirtualAssessment)
  @ApiOperation({ summary: 'Find a virtual assessment by appointment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The virtual assessment has been found successfully',
    schema: {
      example: VIRTUAL_ASSESSMENT_GET_EXAMPLE,
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "The virtual assessment wasn't found",
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('appointmentId') appointmentId: string,
  ): Promise<VirtualAssessment> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }

    return this.virtualAssessmentService.findVirtualAssessmentById(
      appointmentId,
    );
  }

  @Post(VirtualAssessmentApiPath.CreateVirtualAssessment)
  @ApiOperation({ summary: 'Create a virtual assessment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The virtual assessment has been created successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "The virtual assessment can't be created, ",
  })
  @ApiBody({ type: CreateVirtualAssessmentDto })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() virtualAssessmentDto: CreateVirtualAssessmentDto,
  ): Promise<void> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }

    await this.virtualAssessmentService.createVirtualAssessment(
      virtualAssessmentDto,
    );
  }

  @Delete(VirtualAssessmentApiPath.SingleVirtualAssessment)
  @ApiOperation({ summary: 'Delete a virtual assessment by appointment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The virtual assessment has been deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "The virtual assessment for this appontment wasn't found",
  })
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('appointmentId') appointmentId: string,
  ): Promise<void> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }

    return this.virtualAssessmentService.deleteVirtualAssessment(appointmentId);
  }

  @Patch(VirtualAssessmentApiPath.SingleVirtualAssessment)
  @ApiOperation({
    summary: 'Update status of a virtual assessment by appointment ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The virtual assessment status has been updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "The virtual assessment for this appontment wasn't found",
  })
  async updateStatus(
    @Param('appointmentId') appointmentId: string,
    @Body() updateStatusDto: UpdateVirtualAssessmentStatusDto,
  ): Promise<void> {
    return this.virtualAssessmentService.updateStatus(
      appointmentId,
      updateStatusDto,
    );
  }

  @Patch(VirtualAssessmentApiPath.RescheduleVirtualAssessment)
  @ApiOperation({
    summary: 'Reschedule virtual assessment',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The virtual assessment has been rescheduled successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The virtual assessment can be rescheduled only once',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Failed to update the virtual assessment',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async rescheduleAssessment(
    @Param('appointmentId') appointmentId: string,
    @Body() rescheduleAssessmentDto: RescheduleVirtualAssessmentDto,
  ): Promise<void> {
    return this.virtualAssessmentService.rescheduleVirtualAssessment(
      appointmentId,
      rescheduleAssessmentDto,
    );
  }

  @Get(VirtualAssessmentApiPath.UpdateVirtualAssessmentReschedulingStatus)
  @AccessWithoutToken()
  @ApiOperation({
    summary: 'Update virtual assessment rescheduling status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The virtual assessment rescheduling status has been updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Status wasn't provided",
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async updateAssessmentReschedulingStatus(
    @Param('appointmentId') appointmentId: string,
    @Query('status') status: VirtualAssessmentStatus,
    @Res() res: Response,
  ): Promise<void> {
    res.redirect(this.configService.get('CORS_ORIGIN'));
    await this.virtualAssessmentService.updateReschedulingStatus(
      appointmentId,
      status,
    );
  }
}
