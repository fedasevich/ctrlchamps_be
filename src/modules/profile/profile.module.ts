import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Certificate } from 'src/common/entities/certificate.entity';
import { WorkExperience } from 'src/common/entities/work-experience.entity';

import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate, WorkExperience])],
  providers: [ProfileService],
  controllers: [ProfileController],
})
export class ProfileModule {}
