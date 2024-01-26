import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseBoolPipe,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';

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
@UseGuards(TokenGuard)
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
    @Query('isOpenToSeekerHomeLiving', ParseBoolPipe)
    isOpenToSeekerHomeLiving: boolean,
    @Query('isShowAvailableCaregivers', ParseBoolPipe)
    isShowAvailableCaregivers: boolean,
    @Query() queryParams: FilterQueryDto,
  ): Promise<FiltredCaregiver[]> {
    const { services, startDate, endDate, weekdays, ratings } = queryParams;

    return this.caregiverInfoService.filterAll(
      isOpenToSeekerHomeLiving,
      isShowAvailableCaregivers,
      services,
      startDate,
      endDate,
      weekdays,
      ratings,
    );
  }

  @Get(CaregiverApiPath.DetailedInfo)
  @ApiOperation({ summary: 'Get detailed caregiver information' })
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
  async getDetailedInfo(
    @Param('userId') userId: string,
  ): Promise<DetailedCaregiverInfo> {
    return this.caregiverInfoService.getDetailedInfo(userId);
  }
}
