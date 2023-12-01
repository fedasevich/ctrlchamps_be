import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Capability } from 'src/common/entities/capability.entity';

import { CapabilityController } from './capability.controller';
import { CapabilityService } from './capability.service';

@Module({
  imports: [TypeOrmModule.forFeature([Capability])],
  controllers: [CapabilityController],
  providers: [CapabilityService],
})
export class CapabilityModule {}
