import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Appointment } from 'src/common/entities/appointment.entity';
import { CreateAppointmentDto } from 'src/modules/appointment/dto/create-appointment.dto';
import { SeekerActivityService } from 'src/modules/seeker-activity/seeker-activity.service';
import { SeekerCapabilityService } from 'src/modules/seeker-capability/seeker-capability.service';
import { SeekerDiagnosisService } from 'src/modules/seeker-diagnosis/seeker-diagnosis.service';
import { SeekerTaskService } from 'src/modules/seeker-task/seeker-task.service';
import { Repository } from 'typeorm';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly seekerActivityService: SeekerActivityService,
    private readonly seekerTaskService: SeekerTaskService,
    private readonly seekerCapabilityService: SeekerCapabilityService,
    private readonly seekerDiagnosisService: SeekerDiagnosisService,
  ) {}

  async create(createAppointment: CreateAppointmentDto): Promise<void> {
    const {
      seekerTasks,
      seekerActivities,
      seekerCapabilities,
      seekerDiagnoses,
      ...appointment
    } = createAppointment;

    const appointmentId = await this.registerNewAppointment(appointment);

    if (seekerTasks) {
      await Promise.all(
        seekerTasks.map(async (seekerTask) =>
          this.seekerTaskService.create(appointmentId, seekerTask),
        ),
      );
    }

    await Promise.all(
      seekerActivities.map(async (seekerActivity) =>
        this.seekerActivityService.create(
          appointmentId,
          seekerActivity.id,
          seekerActivity.answer,
        ),
      ),
    );

    await Promise.all(
      seekerCapabilities.map(async (seekerCapability) =>
        this.seekerCapabilityService.create(appointmentId, seekerCapability),
      ),
    );

    await Promise.all(
      seekerDiagnoses.map(async (seekerDiagnosis) =>
        this.seekerDiagnosisService.create(appointmentId, seekerDiagnosis),
      ),
    );
  }

  async registerNewAppointment(
    appointment: Partial<Appointment>,
  ): Promise<string> {
    const createdAppointment = await this.appointmentRepository
      .createQueryBuilder()
      .insert()
      .into(Appointment)
      .values(appointment)
      .execute();

    return createdAppointment.generatedMaps[0].id as string;
  }
}
