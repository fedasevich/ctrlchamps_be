import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { Certificate } from 'src/common/entities/certificate.entity';
import { User } from 'src/common/entities/user.entity';
import { WorkExperience } from 'src/common/entities/work-experience.entity';
import { AuthModule } from 'src/modules/auth/auth.module';
import { ProfileController } from 'src/modules/profile/profile.controller';
import { ProfileService } from 'src/modules/profile/profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Certificate,
      WorkExperience,
      CaregiverInfo,
      User,
    ]),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_TOKEN_EXPIRE') },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => AuthModule),
  ],
  providers: [ProfileService],
  controllers: [ProfileController],
  exports: [ProfileService],
})
export class ProfileModule {}
