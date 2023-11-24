import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Certificate } from 'src/common/entities/certificate.entity';
import { User } from 'src/common/entities/user.entity';
import { UserAdditionalInfo } from 'src/common/entities/user.profile.entity';
import { WorkExperience } from 'src/common/entities/work-experience.entity';
import { ProfileController } from 'src/modules/profile/profile.controller';
import { ProfileService } from 'src/modules/profile/profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Certificate,
      WorkExperience,
      UserAdditionalInfo,
      User,
    ]),
  ],
  providers: [ProfileService],
  controllers: [ProfileController],
})
export class ProfileModule {}
