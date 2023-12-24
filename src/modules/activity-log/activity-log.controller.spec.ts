import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { ACTIVITY_LOG } from 'src/modules/activity-log/activity-log.constants';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';

import { ActivityLogController } from './activity-log.controller';
import { ActivityLogService } from './activity-log.service';

describe('ActivityLogController', () => {
  let controller: ActivityLogController;
  let mockActivityLogService;
  let mockAuthGuard;

  beforeEach(async () => {
    mockActivityLogService = {
      create: jest.fn(() => ACTIVITY_LOG),
    };

    mockAuthGuard = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityLogController],
      providers: [
        { provide: ActivityLogService, useValue: mockActivityLogService },
        { provide: TokenGuard, useValue: mockAuthGuard },
      ],
      imports: [JwtModule.register({ secret: 'very_secret_key' })],
    }).compile();

    controller = module.get<ActivityLogController>(ActivityLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an activity log', async () => {
      await expect(controller.create(ACTIVITY_LOG)).resolves.not.toThrow();

      expect(mockActivityLogService.create).toHaveBeenCalledWith(ACTIVITY_LOG);
    });
  });
});
