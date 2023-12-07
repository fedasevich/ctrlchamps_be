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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

import { VirtualAssessment } from 'src/common/entities/virtual-assessment.entity';
import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';
import { AuthenticatedRequest } from 'src/modules/auth/types/user.request.type';

import { VIRTUAL_ASSESSMENT_GET_EXAMPLE } from './constants/virtual_assessment.constant';
import { CreateVirtualAssessmentDto } from './dto/virtual_assessment.dto';
import { VirtualAssessmentApiPath } from './enums/virtual_assessment-path.enum';
import { VirtualAssessmentService } from './virtual_assessment.service';

@ApiTags('Appointment')
@Controller(ApiPath.Appointment)
@UseGuards(TokenGuard)
export class VirtualAssessmentController {
  constructor(
    private readonly virtualAssessmentService: VirtualAssessmentService,
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
    @Param('appointmentId') appointmentId: string,
  ): Promise<VirtualAssessment> {
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
  async remove(@Param('appointmentId') appointmentId: string): Promise<void> {
    return this.virtualAssessmentService.deleteVirtualAssessment(appointmentId);
  }
}
