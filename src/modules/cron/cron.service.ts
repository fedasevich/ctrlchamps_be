import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { convertWeekdayToNumber } from 'src/common/helpers/convert-weekday-to-number.helper';
import { AppointmentService } from 'src/modules/appointment/appointment.service';
import { AppointmentStatus } from 'src/modules/appointment/enums/appointment-status.enum';
import { AppointmentType } from 'src/modules/appointment/enums/appointment-type.enum';
import {
  EVERY_15_MINUTES,
  NEXT_DAY_NUMBER,
} from 'src/modules/cron/cron.constants';

@Injectable()
export class CronService {
  constructor(private appointmentService: AppointmentService) {}

  @Cron(EVERY_15_MINUTES)
  async handleAppointmentStatusCron(): Promise<void> {
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
          appointment.type === AppointmentType.OneTime &&
          appointment.status === AppointmentStatus.Active &&
          currentDateString === startDateString
        ) {
          await this.appointmentService.updateById(appointment.id, {
            status: AppointmentStatus.Ongoing,
          });
        } else if (
          appointment.type === AppointmentType.OneTime &&
          appointment.status === AppointmentStatus.Ongoing &&
          currentDateString === appointment.endDate.toString()
        ) {
          await this.appointmentService.updateById(appointment.id, {
            status: AppointmentStatus.Completed,
          });
        } else if (
          appointment.status === AppointmentStatus.Ongoing &&
          currentDate.getHours() === appointment.endDate.getHours() &&
          currentDate.getMinutes() === appointment.endDate.getMinutes()
        ) {
          if (
            this.isMoreAppointmentDays(
              appointment.endDate,
              appointment.weekday,
              currentDate,
            )
          ) {
            await this.appointmentService.updateById(appointment.id, {
              status: AppointmentStatus.Active,
            });
          } else {
            await this.appointmentService.updateById(appointment.id, {
              status: AppointmentStatus.Completed,
            });
          }
        } else if (
          appointment.status === AppointmentStatus.Active &&
          currentDateString >= startDateString &&
          appointment.startDate.getHours() === currentDate.getHours() &&
          appointment.startDate.getMinutes() === currentDate.getMinutes()
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

  private isMoreAppointmentDays(
    endDate: Date,
    weekday: string,
    currentDate: Date,
  ): boolean {
    const weekdayNumbers = JSON.parse(weekday).map((day: string): number =>
      convertWeekdayToNumber(day),
    );

    currentDate.setDate(currentDate.getDate() + NEXT_DAY_NUMBER);

    while (currentDate.getTime() <= endDate.getTime()) {
      if (weekdayNumbers.includes(currentDate.getDay())) {
        return true;
      }
      currentDate.setDate(currentDate.getDate() + NEXT_DAY_NUMBER);
    }

    return false;
  }
}
