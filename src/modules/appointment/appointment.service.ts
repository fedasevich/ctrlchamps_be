import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Appointment } from 'src/common/entities/appointment.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { CreateAppointmentDto } from 'src/modules/appointment/dto/create-appointment.dto';
import { Appointment as AppointmentType } from 'src/modules/appointment/types/appointment.type';
import { SeekerActivityService } from 'src/modules/seeker-activity/seeker-activity.service';
import { SeekerCapabilityService } from 'src/modules/seeker-capability/seeker-capability.service';
import { SeekerDiagnosisService } from 'src/modules/seeker-diagnosis/seeker-diagnosis.service';
import { SeekerTaskService } from 'src/modules/seeker-task/seeker-task.service';
import { EntityManager, Repository } from 'typeorm';

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

  async create(
    createAppointment: CreateAppointmentDto,
    userId: string,
  ): Promise<void> {
    try {
      await this.appointmentRepository.manager.transaction(
        async (transactionalEntityManager) => {
          const {
            seekerTasks,
            seekerActivities,
            seekerCapabilities,
            seekerDiagnoses,
            ...appointment
          } = createAppointment;

          const appointmentId = await this.registerNewAppointment(
            transactionalEntityManager,
            appointment,
            userId,
          );

          if (seekerTasks) {
            await Promise.all(
              seekerTasks.map((taskName) =>
                this.seekerTaskService.createWithTransaction(
                  transactionalEntityManager,
                  appointmentId,
                  taskName,
                ),
              ),
            );
          }

          await Promise.all(
            seekerActivities.map((activity) =>
              this.seekerActivityService.createWithTransaction(
                transactionalEntityManager,
                appointmentId,
                activity.id,
                activity.answer,
              ),
            ),
          );

          await Promise.all(
            seekerCapabilities.map((capabilityId) =>
              this.seekerCapabilityService.createWithTransaction(
                transactionalEntityManager,
                appointmentId,
                capabilityId,
              ),
            ),
          );

          await Promise.all(
            seekerDiagnoses.map((diagnosisId) =>
              this.seekerDiagnosisService.createWithTransaction(
                transactionalEntityManager,
                appointmentId,
                diagnosisId,
              ),
            ),
          );
        },
      );
    } catch (error) {
      throw new HttpException(
        ErrorMessage.FailedCreateAppointment,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async registerNewAppointment(
    transactionalEntityManager: EntityManager,
    appointment: AppointmentType,
    userId: string,
  ): Promise<string> {
    const { weekdays, ...rest } = appointment;

    const createdAppointment = await transactionalEntityManager
      .createQueryBuilder()
      .insert()
      .into(Appointment)
      .values({ ...rest, weekday: JSON.stringify(weekdays), userId })
      .execute();

    return createdAppointment.generatedMaps[0].id as string;
  }
}
