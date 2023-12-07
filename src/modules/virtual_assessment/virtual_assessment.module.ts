import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from 'src/common/entities/appointment.entity';
import { VirtualAssessment } from 'src/common/entities/virtual-assessment.entity';

import { VirtualAssessmentController } from './virtual_assessment.controller';
import { VirtualAssessmentService } from './virtual_assessment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VirtualAssessment, Appointment]),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_TOKEN_EXPIRE') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [VirtualAssessmentService],
  controllers: [VirtualAssessmentController],
})
export class VirtualAssessmentModule {}
