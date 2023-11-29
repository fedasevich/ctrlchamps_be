import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SeekerDiagnosis } from 'src/common/entities/seeker-diagnosis.entity';

import { SeekerDiagnosisService } from './seeker-diagnosis.service';

@Module({
  imports: [TypeOrmModule.forFeature([SeekerDiagnosis])],
  providers: [SeekerDiagnosisService],
  exports: [SeekerDiagnosisService],
})
export class SeekerDiagnosisModule {}
