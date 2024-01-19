import { Appointment as AppointmentEntity } from 'src/common/entities/appointment.entity';
import { AppointmentStatus } from 'src/modules/appointment/enums/appointment-status.enum';
import { AppointmentType } from 'src/modules/appointment/enums/appointment-type.enum';
import { SortOrder } from 'src/modules/appointment/enums/sort-query.enum';

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
  payment?: number;
  paidForFirstHour?: boolean;
};

export type AppointmentQuery = {
  limit?: number;
  offset?: number;
  name?: string;
  sort?: SortOrder.ASC | SortOrder.DESC;
};

export type AppointmentListResponse = {
  appointments: AppointmentEntity[];
  count: number;
};
