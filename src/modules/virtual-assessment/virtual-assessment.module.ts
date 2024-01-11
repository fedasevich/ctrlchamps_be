import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from 'src/common/entities/appointment.entity';
import { VirtualAssessment } from 'src/common/entities/virtual-assessment.entity';
import { EmailModule } from 'src/modules/email/email.module';

import { NotificationModule } from '../notification/notification.module';

import { VirtualAssessmentController } from './virtual-assessment.controller';
import { VirtualAssessmentService } from './virtual-assessment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VirtualAssessment, Appointment]),
    EmailModule,
    NotificationModule,
  ],
  providers: [VirtualAssessmentService],
  controllers: [VirtualAssessmentController],
  exports: [VirtualAssessmentService],
})
export class VirtualAssessmentModule {}
