import { Module } from '@nestjs/common';

import { CapabilityController } from './capability.controller';
import { CapabilityService } from './capability.service';

@Module({
  controllers: [CapabilityController],
  providers: [CapabilityService],
})
export class CapabilityModule {}
