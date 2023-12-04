import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from 'src/common/entities/appointment.entity';
import { AppointmentController } from 'src/modules/appointment/appointment.controller';
import { AppointmentService } from 'src/modules/appointment/appointment.service';
import { CaregiverInfoModule } from 'src/modules/caregiver-info/caregiver-info.module';
import { EmailModule } from 'src/modules/email/email.module';
import { SeekerActivityModule } from 'src/modules/seeker-activity/seeker-activity.module';
import { SeekerCapabilityModule } from 'src/modules/seeker-capability/seeker-capability.module';
import { SeekerDiagnosisModule } from 'src/modules/seeker-diagnosis/seeker-diagnosis.module';
import { SeekerTaskModule } from 'src/modules/seeker-task/seeker-task.module';
import { UserModule } from 'src/modules/users/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    SeekerActivityModule,
    SeekerCapabilityModule,
    SeekerDiagnosisModule,
    SeekerTaskModule,
    CaregiverInfoModule,
    UserModule,
    EmailModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}
