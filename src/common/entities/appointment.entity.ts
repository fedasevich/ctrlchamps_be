import { ApiProperty } from '@nestjs/swagger';

import { ActivityLog } from 'src/common/entities/activity-log.entity';
import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { Notification } from 'src/common/entities/notification.entity';
import { SeekerActivity } from 'src/common/entities/seeker-activity.entity';
import { SeekerCapability } from 'src/common/entities/seeker-capability.entity';
import { SeekerDiagnosis } from 'src/common/entities/seeker-diagnosis.entity';
import { SeekerTask } from 'src/common/entities/seeker-task.entity';
import { TransactionHistory } from 'src/common/entities/transaction-history.entity';
import { User } from 'src/common/entities/user.entity';
import { VirtualAssessment } from 'src/common/entities/virtual-assessment.entity';
import { AppointmentStatus } from 'src/modules/appointment/enums/appointment-status.enum';
import { AppointmentType } from 'src/modules/appointment/enums/appointment-type.enum';
import { DebtStatus } from 'src/modules/appointment/enums/debt-status.enum';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Appointment {
  @ApiProperty({
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
    description: 'Unique identifier of the appointment',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
    description: 'User ID associated with the appointment',
  })
  @Column()
  userId: string;

  @ApiProperty({
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
    description: 'Caregiver Info ID associated with the appointment',
  })
  @Column()
  caregiverInfoId: string;

  @ApiProperty({
    example: 'Urgent Appointment',
    description: 'Name of the appointment',
  })
  @Column()
  name: string;

  @ApiProperty({
    enum: AppointmentType,
    description: 'Type of the appointment',
  })
  @Column({
    type: 'enum',
    enum: AppointmentType,
  })
  type: AppointmentType;

  @ApiProperty({
    enum: AppointmentStatus,
    description: 'Current status of the appointment',
  })
  @Column({
    type: 'enum',
    enum: AppointmentStatus,
  })
  status: AppointmentStatus;

  @ApiProperty({
    example: 'Details about the appointment',
    description: 'Additional details of the appointment',
  })
  @Column({ nullable: true })
  details: string;

  @ApiProperty({
    description: 'Payment for one hour',
    example: '10',
  })
  @Column({ default: 0, type: 'int' })
  payment: number;

  @ApiProperty({
    description: 'Paid for first hour',
    example: 'true',
  })
  @Column({ default: false })
  paidForFirstHour: boolean;

  @ApiProperty({
    example: 'Location Address',
    description: 'Location of the appointment',
  })
  @Column()
  location: string;

  @ApiProperty({
    example: 'Activity notes',
    description: 'Notes about the activity',
    required: false,
  })
  @Column({ nullable: true })
  activityNote: string;

  @ApiProperty({
    example: 'Diagnosis notes',
    description: 'Notes about the diagnosis',
    required: false,
  })
  @Column({ nullable: true })
  diagnosisNote: string;

  @ApiProperty({
    example: 'Capability notes',
    description: 'Notes about the capability',
    required: false,
  })
  @Column({ nullable: true })
  capabilityNote: string;

  @ApiProperty({
    example: '2023-11-28T15:30:00.000Z',
    description: 'Start date of the appointment',
  })
  @Column('timestamp')
  startDate: Date;

  @ApiProperty({
    example: '2023-11-28T15:30:00.000Z',
    description: 'End date of the appointment',
  })
  @Column('timestamp')
  endDate: Date;

  @ApiProperty({
    example: 'Europe/Kiev',
    description: 'Timezone of the seeker',
  })
  @Column()
  timezone: string;

  @ApiProperty({
    example: 'Monday, Wednesday',
    description: 'Weekdays of the appointment',
  })
  @Column({ nullable: true })
  weekday: string;

  @ApiProperty({
    example: '2023-11-28T15:30:00.000Z',
    description: 'Signing date',
  })
  @Column({ type: 'timestamp', nullable: true })
  signingDate: Date;

  @ApiProperty({
    enum: DebtStatus,
    description: 'Current status of the debt',
  })
  @Column({
    type: 'enum',
    enum: DebtStatus,
    default: DebtStatus.Absent,
  })
  debtStatus: DebtStatus;

  @ApiProperty({
    example: 50,
    description: 'Seeker debt for the appointment',
  })
  @Column({
    type: 'float',
    default: 0,
  })
  seekerDebt: number;

  @ApiProperty({
    example: '2023-11-28T15:30:00.000Z',
    description: 'Date of the appointment creation',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    example: '2023-11-28T15:30:00.000Z',
    description: 'Date when appointment was paused',
  })
  @Column({ type: 'timestamp', default: null, nullable: true })
  pausedAt: Date;

  @OneToMany(
    () => SeekerDiagnosis,
    (seekerDiagnosis) => seekerDiagnosis.appointment,
  )
  seekerDiagnoses: SeekerDiagnosis[];

  @OneToMany(
    () => SeekerCapability,
    (seekerCapability) => seekerCapability.appointment,
  )
  seekerCapabilities: SeekerCapability[];

  @OneToMany(
    () => SeekerActivity,
    (seekerActivity) => seekerActivity.appointment,
  )
  seekerActivities: SeekerActivity[];

  @OneToMany(() => SeekerTask, (seekerTask) => seekerTask.appointment)
  seekerTasks: SeekerTask[];

  @ManyToOne(() => CaregiverInfo, (caregiverInfo) => caregiverInfo.appointment)
  @JoinColumn({ name: 'caregiverInfoId' })
  caregiverInfo: CaregiverInfo;

  @ManyToOne(() => User, (user) => user.appointment)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(
    () => VirtualAssessment,
    (virtualAssessment) => virtualAssessment.appointment,
  )
  virtualAssessment: VirtualAssessment;

  @OneToMany(() => ActivityLog, (activityLog) => activityLog.appointment)
  activityLog: ActivityLog[];

  @OneToMany(() => TransactionHistory, (transaction) => transaction.appointment)
  transaction: TransactionHistory[];

  @OneToMany(() => Notification, (notification) => notification.appointment)
  notification: Notification[];
}
