import { AppointmentStatus } from 'src/modules/appointment/enums/appointment-status.enum';
import { AppointmentType } from 'src/modules/appointment/enums/appointment-type.enum';

export type Appointment = {
  caregiverInfoId: string;
  name: string;
  type: AppointmentType;
  status: AppointmentStatus;
  details?: string;
  location: string;
  activityNote?: string;
  diagnosisNote?: string;
  capabilityNote?: string;
  startDate: Date;
  endDate: Date;
  timezone: string;
  weekdays?: string[];
};
