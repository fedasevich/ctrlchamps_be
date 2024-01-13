import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'common/entities/user.entity';
import { CaregiverInfoModule } from 'modules/caregiver-info/caregiver-info.module';
import { EmailModule } from 'modules/email/email.module';
import { PasswordModule } from 'modules/update-password/update-password.module';
import { UserModule } from 'modules/users/user.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_TOKEN_EXPIRE') },
      }),
      inject: [ConfigService],
      global: true,
    }),
    UserModule,
    PasswordModule,
    EmailModule,
    forwardRef(() => CaregiverInfoModule),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
