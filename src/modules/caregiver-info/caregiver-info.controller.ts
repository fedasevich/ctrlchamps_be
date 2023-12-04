import { Controller, Get, Param, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';

import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';

import { CaregiverInfoService } from './caregiver-info.service';
import { CaregiverApiPath } from './enums/caregiver.enum';
import { DetailedCaregiverInfo } from './types/detailed-caregiver-info.type';
import { FiltredCaregiver } from './types/filtred-caregiver.type';

@ApiTags('Caregiver Info')
@Controller(ApiPath.CaregiverInfo)
export class CaregiverInfoController {
  constructor(private readonly caregiverInfoService: CaregiverInfoService) {}

  @Get(CaregiverApiPath.FiltredCaregivers)
  @ApiOperation({ summary: 'Get filtred caregivers list' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Caregiver profile list retrieved successfully',
    schema: {
      example: [
        {
          id: '2f09b807-72ee-49ea-83d2-17b7746957a2',
          hourlyRate: 20,
          firstName: 'Max',
          lastName: 'Volovo',
        },
        {
          id: '2f09b807-72ee-49ea-83d2-17b7746957a3',
          hourlyRate: 25,
          firstName: 'Alice',
          lastName: 'James',
        },
      ],
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
  async filterAll(@Query('query') query: string): Promise<FiltredCaregiver[]> {
    return this.caregiverInfoService.filterAll(query);
  }

  @Get(CaregiverApiPath.DetailedInfo)
  @ApiOperation({ summary: 'Get filtred caregivers list' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Caregiver detailed info retrieved successfully',
    schema: {
      example: {
        id: '2f09b807-72ee-49ea-83d2-17b7746957a3',
        hourlyRate: 25,
        firstName: 'Alice',
        lastName: 'James',
        isOpenToSeekerHomeLiving: true,
        numberOfAppointments: 2,
        description: 'I am an experienced nurse..',
        videoLink: 'https://youtube.com/user/video',
        services: ['Personal Care Assistance', 'Medication Management'],
        certificates: [
          {
            workplace: 'ABC Hospital',
            qualifications: 'Clinic',
            startDate: '2020-11-11',
            endDate: '2021-11-11',
          },
        ],
        workExperiences: [
          {
            name: 'First Aid Training',
            certificateId: 'CER12345',
            link: 'https://certificateprovider.com/certificate/123',
            dateIssued: '2020-11-11',
            expirationDate: '2021-11-11',
          },
        ],
      },
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
