import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';

import { CaregiverInfoService } from './caregiver-info.service';
import {
  DETAILED_CAREGIVER_INFO_EXAMPLE,
  FILTRED_CAREGIVERS_EXAMPLE,
} from './constants/caregiver-info.constants';
import { FilterQueryDto } from './dto/filter-query.dto';
import { CaregiverApiPath } from './enums/caregiver.enum';
import { DetailedCaregiverInfo } from './types/detailed-caregiver-info.type';
import { FiltredCaregiver } from './types/filtred-caregiver.type';

@ApiTags('Caregiver Info')
@Controller(ApiPath.CaregiverInfo)
export class CaregiverInfoController {
  constructor(private readonly caregiverInfoService: CaregiverInfoService) {}

  @Get(CaregiverApiPath.FiltredCaregivers)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )
  @ApiOperation({ summary: 'Get filtred caregivers list' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Caregiver profile list retrieved successfully',
    schema: {
      example: FILTRED_CAREGIVERS_EXAMPLE,
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Caregivers not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  async filterAll(
    @Query() queryParams: FilterQueryDto,
  ): Promise<FiltredCaregiver[]> {
    return this.caregiverInfoService.filterAll(
      queryParams.isOpenToSeekerHomeLiving,
      queryParams.services,
    );
  }

  @Get(CaregiverApiPath.DetailedInfo)
  @ApiOperation({ summary: 'Get filtred caregivers list' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Caregiver detailed info retrieved successfully',
    schema: {
      example: DETAILED_CAREGIVER_INFO_EXAMPLE,
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Caregiver not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  getDetailedInfo(
    @Param('userId') userId: string,
  ): Promise<DetailedCaregiverInfo> {
    return this.caregiverInfoService.getDetailedInfo(userId);
  }
}
