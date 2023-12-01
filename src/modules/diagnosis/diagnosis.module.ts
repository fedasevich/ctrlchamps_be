import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Diagnosis } from 'src/common/entities/diagnosis.entity';

import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';

@Module({
  imports: [TypeOrmModule.forFeature([Diagnosis])],
  controllers: [DiagnosisController],
  providers: [DiagnosisService],
})
export class DiagnosisModule {}
