import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from 'src/common/entities/appointment.entity';
import { VirtualAssessment } from 'src/common/entities/virtual-assessment.entity';

import { VirtualAssessmentController } from './virtual_assessment.controller';
import { VirtualAssessmentService } from './virtual_assessment.service';

@Module({
  imports: [TypeOrmModule.forFeature([VirtualAssessment, Appointment])],
  providers: [VirtualAssessmentService],
  controllers: [VirtualAssessmentController],
})
export class VirtualAssessmentModule {}
