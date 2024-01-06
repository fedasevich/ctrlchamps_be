import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from 'src/common/entities/user.entity';

import { AdminPanelService } from './admin-panel.service';
import {
  FETCHED_ADMINS_EXAMPLE,
  PAGINATION_LIMIT,
} from './constants/admin-panel.constants';

describe('AdminPanelService', () => {
  let service: AdminPanelService;
  let mockRepository;

  beforeEach(async () => {
    mockRepository = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([
            FETCHED_ADMINS_EXAMPLE.data,
            FETCHED_ADMINS_EXAMPLE.data.length,
          ]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPanelService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AdminPanelService>(AdminPanelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch admins', async () => {
    const result = await service.fetchAdmins({
      limit: PAGINATION_LIMIT,
      offset: 0,
    });
    expect(result).toEqual({
      data: FETCHED_ADMINS_EXAMPLE.data,
      count: FETCHED_ADMINS_EXAMPLE.data.length,
    });
    expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
  });
});
