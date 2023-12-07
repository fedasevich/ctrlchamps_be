import { Test, TestingModule } from '@nestjs/testing';
import { VirtualAssessmentController } from './virtual_assessment.controller';

describe('VirtualAssessmentController', () => {
  let controller: VirtualAssessmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VirtualAssessmentController],
    }).compile();

    controller = module.get<VirtualAssessmentController>(VirtualAssessmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
