import { ApiProperty } from '@nestjs/swagger';

import { IsOptional, IsBoolean } from 'class-validator';
import { Qualification } from 'src/common/enums/qualification.enum';

export class FilterCaregiversDto {
  @ApiProperty({
    description: 'Array of qualifications',
    example: ['Personal Care Assistance', 'Medication Management'],
    required: false,
  })
  @IsOptional()
  services?: Qualification[];

  @ApiProperty({
    description:
      "Indicates whether the caregiver is open to living in a seeker's home",
    example: 'true',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isOpenToSeekerHomeLiving?: boolean | null;

  @ApiProperty({
    description: 'Indicates whether the caregiver is available',
    example: 'true',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isShowAvailableCaregivers?: boolean | null;
}
