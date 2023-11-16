import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OtpCode } from './common/entities/otp-code.entity';
import { User } from './common/entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { OtpCodeModule } from './modules/otp-code/otp-code.module';

import 'dotenv/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: 'test',
        entities: [User, OtpCode],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    EmailModule,
    OtpCodeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
