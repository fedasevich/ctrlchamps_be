import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsNotEmpty } from 'class-validator';
import { VirtualAssessmentStatus } from 'src/common/enums/virtual-assessment.enum';

export class UpdateVirtualAssessmentStatusDto {
  @ApiProperty({
    description: 'Status of the virtual assessment',
    enum: VirtualAssessmentStatus,
  })
  @IsEnum(VirtualAssessmentStatus)
  @IsNotEmpty()
  status: VirtualAssessmentStatus;
}
