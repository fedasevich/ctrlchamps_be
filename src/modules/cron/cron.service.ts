import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addHours, isAfter } from 'date-fns';

import { TODAY_DATE } from 'src/common/constants/date.constants';
import { NotificationMessage } from 'src/common/enums/notification-message.enum';
import { VirtualAssessmentStatus } from 'src/common/enums/virtual-assessment.enum';
import { convertWeekdayToNumber } from 'src/common/helpers/convert-weekday-to-number.helper';
import { AppointmentService } from 'src/modules/appointment/appointment.service';
import { AppointmentStatus } from 'src/modules/appointment/enums/appointment-status.enum';
import { AppointmentType } from 'src/modules/appointment/enums/appointment-type.enum';
import {
  EVERY_10_MINUTES,
  EVERY_15_MINUTES,
  NEXT_DAY_NUMBER,
  PAYMENT_APPOINTMENT_DEADLINE,
} from 'src/modules/cron/cron.constants';
import { EmailService } from 'src/modules/email/services/email.service';

import { NotificationService } from '../notification/notification.service';
import { PaymentService } from '../payment/payment.service';
import { VirtualAssessmentService } from '../virtual-assessment/virtual-assessment.service';

@Injectable()
export class CronService {
  private readonly seekerVirtualAssessmentDoneTemplateId =
    this.configService.get<string>(
      'SENDGRID_SEEKER_SUBMIT_CONTRACT_PROPOSAL_TEMPLATE_ID',
    );

  private readonly caregiverVirtualAssessmentDoneTemplateId =
    this.configService.get<string>(
      'SENDGRID_CAREGIVER_SUBMIT_CONTRACT_PROPOSAL_TEMPLATE_ID',
    );

  private readonly assessmentReminderTemplateId =
    this.configService.get<string>('SENDGRID_ASSESSMENT_REMINDER_TEMPLATE_ID');

  constructor(
    private configService: ConfigService,
    private appointmentService: AppointmentService,
    private paymentService: PaymentService,
    private virtualAssessmentService: VirtualAssessmentService,
    private notificationService: NotificationService,
    private emailService: EmailService,
  ) {}

  @Cron(EVERY_15_MINUTES)
  async checkVirtualAssessmentStatus(): Promise<void> {
    const todaysVirtualAssessments =
      await this.virtualAssessmentService.getTodaysVirtualAssessmentsByTime();
    await Promise.all(
      todaysVirtualAssessments.map(async (virtualAssessment) => {
        this.virtualAssessmentService.updateStatus(
          virtualAssessment.appointment.id,
          { status: VirtualAssessmentStatus.Finished },
        );

        this.notificationService.createNotification(
          virtualAssessment.appointment.caregiverInfo.user.id,
          virtualAssessment.appointment.id,
          NotificationMessage.SignOff,
          virtualAssessment.appointment.user.id,
        );

        this.notificationService.createNotification(
          virtualAssessment.appointment.user.id,
          virtualAssessment.appointment.id,
          NotificationMessage.SignOff,
          virtualAssessment.appointment.caregiverInfo.user.id,
        );

        this.emailService.sendEmail({
          to: virtualAssessment.appointment.user.email,
          templateId: this.seekerVirtualAssessmentDoneTemplateId,
        });

        this.emailService.sendEmail({
          to: virtualAssessment.appointment.caregiverInfo.user.email,
          templateId: this.caregiverVirtualAssessmentDoneTemplateId,
        });
      }),
    );
  }

  @Cron(EVERY_15_MINUTES)
  async checkUnpaidAppointments(): Promise<void> {
    const todayUnpaidAppointments =
      await this.appointmentService.getTodayUnpaidAppointments();
    const currentTime = TODAY_DATE;

    await Promise.all(
      todayUnpaidAppointments.map(async (appointment) => {
        const paymentDeadline = addHours(
          appointment.startDate,
          PAYMENT_APPOINTMENT_DEADLINE,
        );

        if (isAfter(currentTime, paymentDeadline)) {
          await this.appointmentService.cancelUnpaidAppointment(appointment.id);
        }
      }),
    );
  }

  @Cron(EVERY_15_MINUTES)
  async handleAppointmentStatusCron(): Promise<void> {
    await this.checkAndUpdateAppointments();
  }

  private async checkAndUpdateAppointments(): Promise<void> {
    const { appointments } = await this.appointmentService.findAll();

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
          await this.notificationService.createNotification(
            appointment.caregiverInfo.user.id,
            appointment.id,
            NotificationMessage.ActivityLogRequest,
            appointment.user.id,
          );
        } else if (
          appointment.status === AppointmentStatus.Ongoing &&
          currentDate.getHours() === appointment.endDate.getHours() &&
          currentDate.getMinutes() === appointment.endDate.getMinutes()
        ) {
          await this.notificationService.createNotification(
            appointment.caregiverInfo.user.id,
            appointment.id,
            NotificationMessage.ActivityLogRequest,
            appointment.user.id,
          );
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

  @Cron(EVERY_10_MINUTES)
  async checkAppointmentStatusAndCharge(): Promise<void> {
    const appointments =
      await this.appointmentService.checkAppointmentToBePaid();

    appointments.forEach(async (appointment) => {
      if (appointment.type === AppointmentType.OneTime) {
        await this.paymentService.chargeForOneTimeAppointment(appointment.id);
      } else if (appointment.type === AppointmentType.Recurring) {
        await this.paymentService.chargeRecurringPaymentTask(appointment.id);
      }
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendVirtualAssessmentStartNotification(): Promise<void> {
    const virtualAssessments =
      await this.virtualAssessmentService.getAssessmentsStartingInFiveMinutes();

    await Promise.all(
      virtualAssessments.map(async (virtualAssessment) => {
        await this.notificationService.createNotification(
          virtualAssessment.appointment.caregiverInfo.user.id,
          virtualAssessment.appointment.id,
          NotificationMessage.FiveMinBeforeVA,
          virtualAssessment.appointment.user.id,
        );

        await this.notificationService.createNotification(
          virtualAssessment.appointment.user.id,
          virtualAssessment.appointment.id,
          NotificationMessage.FiveMinBeforeVA,
          virtualAssessment.appointment.caregiverInfo.user.id,
        );

        await this.emailService.sendEmail({
          to: virtualAssessment.appointment.user.email,
          templateId: this.assessmentReminderTemplateId,
        });

        await this.emailService.sendEmail({
          to: virtualAssessment.appointment.caregiverInfo.user.email,
          templateId: this.assessmentReminderTemplateId,
        });
      }),
    );
  }
}
