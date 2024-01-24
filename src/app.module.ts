import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import 'dotenv/config';

import { ActivityLog } from 'src/common/entities/activity-log.entity';
import { Activity } from 'src/common/entities/activity.entity';
import { Appointment } from 'src/common/entities/appointment.entity';
import { Capability } from 'src/common/entities/capability.entity';
import { Diagnosis } from 'src/common/entities/diagnosis.entity';
import { SeekerActivity } from 'src/common/entities/seeker-activity.entity';
import { SeekerCapability } from 'src/common/entities/seeker-capability.entity';
import { SeekerDiagnosis } from 'src/common/entities/seeker-diagnosis.entity';
import { SeekerTask } from 'src/common/entities/seeker-task.entity';
import { ActivityModule } from 'src/modules/activity/activity.module';
import { ActivityLogModule } from 'src/modules/activity-log/activity-log.module';
import { AdminPanelModule } from 'src/modules/admin-panel/admin-panel.module';
import { AppointmentModule } from 'src/modules/appointment/appointment.module';
import { CapabilityModule } from 'src/modules/capability/capability.module';
import { CaregiverInfoModule } from 'src/modules/caregiver-info/caregiver-info.module';
import { DiagnosisModule } from 'src/modules/diagnosis/diagnosis.module';
import { SeedingService } from 'src/modules/seed/seed.service';
import { SeekerActivityModule } from 'src/modules/seeker-activity/seeker-activity.module';
import { SeekerCapabilityModule } from 'src/modules/seeker-capability/seeker-capability.module';
import { SeekerDiagnosisModule } from 'src/modules/seeker-diagnosis/seeker-diagnosis.module';
import { SeekerTaskModule } from 'src/modules/seeker-task/seeker-task.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CaregiverInfo } from './common/entities/caregiver.profile.entity';
import { Certificate } from './common/entities/certificate.entity';
import { DefaultSeekerTask } from './common/entities/default-seeker-task.entity';
import { Notification } from './common/entities/notification.entity';
import { SeekerReview } from './common/entities/seeker-reviews.entity';
import { TransactionHistory } from './common/entities/transaction-history.entity';
import { User } from './common/entities/user.entity';
import { VirtualAssessment } from './common/entities/virtual-assessment.entity';
import { WorkExperience } from './common/entities/work-experience.entity';
import { AuthModule } from './modules/auth/auth.module';
import { CronModule } from './modules/cron/cron.module';
import { EmailModule } from './modules/email/email.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ProfileModule } from './modules/profile/profile.module';
import { SeekerReviewModule } from './modules/seeker-review/seeker-review.module';
import { DefaultSeekerTaskModule } from './modules/seeker-task/default-seeker-task/default-seeker-task.module';
import { UserModule } from './modules/users/user.module';
import { VirtualAssessmentModule } from './modules/virtual-assessment/virtual-assessment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [
          User,
          CaregiverInfo,
          Certificate,
          WorkExperience,
          Activity,
          Appointment,
          Capability,
          Diagnosis,
          SeekerActivity,
          SeekerCapability,
          SeekerDiagnosis,
          SeekerTask,
          DefaultSeekerTask,
          VirtualAssessment,
          PaymentModule,
          ActivityLog,
          SeekerReview,
          TransactionHistory,
          Notification,
        ],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    EmailModule,
    AppointmentModule,
    SeekerTaskModule,
    ActivityModule,
    SeekerActivityModule,
    CapabilityModule,
    SeekerCapabilityModule,
    DiagnosisModule,
    SeekerDiagnosisModule,
    ProfileModule,
    CaregiverInfoModule,
    VirtualAssessmentModule,
    ActivityLogModule,
    CronModule,
    PaymentModule,
    AdminPanelModule,
    NotificationModule,
    DefaultSeekerTaskModule,
    SeekerReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedingService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly seedingService: SeedingService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedingService.seed();
  }
}
