import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Diagnosis } from 'src/common/entities/diagnosis.entity';
import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';
import { DiagnosisApiPath } from 'src/modules/diagnosis/enums/diagnosis.api-path.enum';

import { DiagnosisService } from './diagnosis.service';

@ApiTags('Diagnosis')
@Controller(ApiPath.Diagnosis)
@UseGuards(TokenGuard)
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @ApiOperation({ summary: 'Get all diagnoses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Diagnoses were sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.FailedSendDiagnoses,
  })
  @Get(DiagnosisApiPath.Root)
  findAll(): Promise<Diagnosis[]> {
    return this.diagnosisService.findAll();
  }
}
