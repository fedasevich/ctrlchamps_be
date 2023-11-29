import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SeekerCapability } from 'src/common/entities/seeker-capability.entity';

import { SeekerCapabilityService } from './seeker-capability.service';

@Module({
  imports: [TypeOrmModule.forFeature([SeekerCapability])],
  providers: [SeekerCapabilityService],
  exports: [SeekerCapabilityService],
})
export class SeekerCapabilityModule {}
