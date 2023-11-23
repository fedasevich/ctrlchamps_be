import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Certificate } from 'src/common/entities/certificate.entity';
import { WorkExperience } from 'src/common/entities/work-experience.entity';

import { CreateCertificateDto } from './dto/create-certificate.dto';
import { CreateWorkExperienceDto } from './dto/work-experience.dto';
import { ProfileService } from './profile.service';

@ApiTags('Complete profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('/certificate/:userId')
  @ApiOperation({ summary: 'Certificate Added' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Certificate added successfully',
    schema: {
      example: {
        certificate: 'CER20-fojgw12',
      },
    },
  })
  addCertificate(
    @Body() createCertificateDto: CreateCertificateDto,
  ): Promise<Certificate> {
    return this.profileService.createCertificate(createCertificateDto);
  }

  @Post('/work-experience/:userId')
  @ApiOperation({ summary: 'Work Experience Added' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Work Experience added successfully',
    schema: {
      example: {
        workExperience: 'WorkExp20-123',
      },
    },
  })
  addWorkExperience(
    @Body() workExperienceDto: CreateWorkExperienceDto,
  ): Promise<WorkExperience> {
    return this.profileService.createWorkExperience(workExperienceDto);
  }
}
