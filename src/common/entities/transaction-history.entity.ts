import { ApiProperty } from '@nestjs/swagger';

import { User } from 'src/common/entities/user.entity';
import { TransactionType } from 'src/modules/payment/enums/transaction-type.enum';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Appointment } from './appointment.entity';

@Entity()
export class TransactionHistory {
  @ApiProperty({
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
    description: 'Unique identifier of the transaction',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
    description: 'User ID associated with the transaction',
  })
  @Column()
  userId: string;

  @ApiProperty({
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
    description: 'Appointment ID associated with the transaction',
    required: false,
  })
  @Column({ default: null, type: 'string' })
  appointmentId: string;

  @ApiProperty({
    enum: TransactionType,
    description: 'Type of the transaction',
  })
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @ApiProperty({
    description: 'Amount of transaction',
    example: '50',
  })
  @Column({ default: 0, type: 'int' })
  amount: number;

  @ManyToOne(() => User, (user) => user.transaction)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Appointment, (appointment) => appointment.transaction, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @ApiProperty({
    description: 'Date of transaction',
    example: '2021-01-01 00:00:00',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
