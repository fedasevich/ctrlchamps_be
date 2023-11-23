import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Certificate } from 'src/common/entities/certificate.entity';
import { WorkExperience } from 'src/common/entities/work-experience.entity';
import { Repository } from 'typeorm';

import { CreateCertificateDto } from './dto/create-certificate.dto';
import { CreateWorkExperienceDto } from './dto/work-experience.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    @InjectRepository(WorkExperience)
    private readonly workExperienceRepository: Repository<WorkExperience>,
  ) {}

  async createCertificate(
    createCertificateDto: CreateCertificateDto,
  ): Promise<Certificate> {
    return this.certificateRepository.save(createCertificateDto);
  }

  async createWorkExperience(
    createWorkExperienceDto: CreateWorkExperienceDto,
  ): Promise<WorkExperience> {
    return this.workExperienceRepository.save(createWorkExperienceDto);
  }
}
