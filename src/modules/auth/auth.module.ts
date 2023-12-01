import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'common/entities/user.entity';
import { EmailModule } from 'modules/email/email.module';
import { UserService } from 'modules/users/user.service';

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
    EmailModule,
  ],
  providers: [AuthService, UserService],
  controllers: [AuthController],
})
export class AuthModule {}
