import { Test, TestingModule } from '@nestjs/testing';

import { CaregiverInfoController } from 'modules/caregiver-info/caregiver-info.controller';
import { CaregiverInfoService } from 'modules/caregiver-info/caregiver-info.service';
import { UserService } from 'modules/users/user.service';

import {
  FILTRED_CAREGIVERS_EXAMPLE,
  DETAILED_CAREGIVER_INFO_EXAMPLE,
} from './constants/caregiver-info.constants';
import { FilterQueryDto } from './dto/filter-query.dto';

describe('CaregiverInfoController', () => {
  let controller: CaregiverInfoController;
  let mockCaregiverInfoService;

  beforeEach(async () => {
    mockCaregiverInfoService = {
      filterAll: jest.fn(() => FILTRED_CAREGIVERS_EXAMPLE),
      getDetailedInfo: jest.fn(() => DETAILED_CAREGIVER_INFO_EXAMPLE),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaregiverInfoController],
      providers: [
        { provide: CaregiverInfoService, useValue: mockCaregiverInfoService },
        { provide: UserService, useValue: mockCaregiverInfoService },
      ],
    }).compile();

    controller = module.get<CaregiverInfoController>(CaregiverInfoController);
  });

  it('controller should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('filterAll', () => {
    it('should return filtres caregiver`s list', async () => {
      const queryParams: FilterQueryDto = {
        isOpenToSeekerHomeLiving: true,
        isShowAvailableCaregivers: true,
        country: 'United States',
        city: 'Compton',
        address: 'South Alameda Street East',
        state: 'California',
        zipCode: '90221',
        utcOffset: -480,
        services: ['Personal Care Assistance'],
      };
      const result = await controller.filterAll(
        queryParams.isOpenToSeekerHomeLiving,
        queryParams,
      );
      expect(result).toEqual(FILTRED_CAREGIVERS_EXAMPLE);
      expect(mockCaregiverInfoService.filterAll).toHaveBeenCalledWith(
        queryParams.isOpenToSeekerHomeLiving,
        queryParams.services,
      );
    });
  });

  describe('getDetailedInfo', () => {
    it('should return detailed caregiver`s info', async () => {
      const userId: string = '2f09b807-72ee-49ea-83d2-17b7746957a2';
      const result = await controller.getDetailedInfo(userId);
      expect(result).toEqual(DETAILED_CAREGIVER_INFO_EXAMPLE);
      expect(mockCaregiverInfoService.getDetailedInfo).toHaveBeenCalledWith(
        userId,
      );
    });
  });
});
