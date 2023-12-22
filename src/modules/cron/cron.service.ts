import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AppointmentService } from 'src/modules/appointment/appointment.service';
import { AppointmentStatus } from 'src/modules/appointment/enums/appointment-status.enum';
import { AppointmentType } from 'src/modules/appointment/enums/appointment-type.enum';

import { convertWeekdayToNumber } from '../../common/helpers/convert-weekday-to-number';

@Injectable()
export class CronService {
  constructor(private appointmentService: AppointmentService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron(): Promise<void> {
    console.log('Cron is working');

    await this.checkAndUpdateAppointments();
  }

  private async checkAndUpdateAppointments(): Promise<void> {
    const appointments = await this.appointmentService.findAll();

    await Promise.all(
      appointments.map(async (appointment): Promise<void> => {
        const currentDate = new Date();
        const currentDateString = currentDate.toString();
        const startDateString = appointment.startDate.toString();

        if (
          appointment.status === AppointmentStatus.Active &&
          currentDateString === startDateString
        ) {
          await this.appointmentService.updateById(appointment.id, {
            status: AppointmentStatus.Ongoing,
          });
        } else if (
          appointment.status === AppointmentStatus.Ongoing &&
          currentDateString === appointment.endDate.toString()
        ) {
          await this.appointmentService.updateById(appointment.id, {
            status: AppointmentStatus.Completed,
          });
        } else if (
          appointment.type === AppointmentType.Recurring &&
          appointment.status === AppointmentStatus.Ongoing &&
          currentDate.getHours() === appointment.endDate.getHours() &&
          currentDate.getMinutes() === appointment.endDate.getMinutes()
        ) {
          await this.appointmentService.updateById(appointment.id, {
            status: AppointmentStatus.Active,
          });
        } else if (
          appointment.type === AppointmentType.Recurring &&
          appointment.status === AppointmentStatus.Active &&
          currentDateString > startDateString
        ) {
          const isAppointmentDay = this.IsAppointmentTime(
            appointment.startDate,
            appointment.weekday,
            currentDate,
          );

          if (isAppointmentDay) {
            await this.appointmentService.updateById(appointment.id, {
              status: AppointmentStatus.Ongoing,
            });
          }
        }
      }),
    );
  }

  private IsAppointmentTime(
    startDate: Date,
    weekday: string,
    currentDate: Date,
  ): boolean {
    const weekdayNumbers = JSON.parse(weekday).map((day: string): number =>
      convertWeekdayToNumber(day),
    );

    return (
      weekdayNumbers.includes(currentDate.getDay()) &&
      startDate.getHours() === currentDate.getHours() &&
      startDate.getMinutes() === currentDate.getMinutes()
    );
  }
}
