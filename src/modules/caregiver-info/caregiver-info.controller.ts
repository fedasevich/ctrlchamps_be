/* eslint-disable max-classes-per-file */
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

import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';

// eslint-disable-next-line import/no-cycle
import { CaregiverInfoService } from './caregiver-info.service';
import {
  DETAILED_CAREGIVER_INFO_EXAMPLE,
  FILTRED_CAREGIVERS_EXAMPLE,
} from './constants/caregiver-info.constants';
import { CaregiverApiPath } from './enums/caregiver.enum';
import { DetailedCaregiverInfo } from './types/detailed-caregiver-info.type';
import { FiltredCaregiver } from './types/filtred-caregiver.type';

export class dto {
  @IsBoolean()
  @Type(() => Boolean)
  isOpenToSeekerHomeLiving: string;

  @IsBoolean()
  @Type(() => Boolean)
  isShowAvailableCaregivers: boolean;

  @IsString()
  country: string;

  @IsString()
  city: string;

  @IsString()
  address: string;

  @IsString()
  state: string;

  @IsString()
  zipCode: string;

  @Type(() => Number)
  utcOffset: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : Array(value)))
  services?: string[];
}

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
    @Query() queryParams: YourQueryDto,
  ): Promise<FiltredCaregiver[]> {
    return this.caregiverInfoService.filterAll(queryParams);
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
