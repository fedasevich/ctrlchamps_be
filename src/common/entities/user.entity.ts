import { ApiProperty } from '@nestjs/swagger';

import { Country } from 'modules/users/enums/country.enum';
import { UserRole } from 'modules/users/enums/user-role.enum';
import { Appointment } from 'src/common/entities/appointment.entity';
import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { TransactionHistory } from 'src/common/entities/transaction-history.entity';
import { UserStatus } from 'src/modules/users/enums/user-status.enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @ApiProperty({
    description: "User's id",
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: "User's email",
    example: 'user@gmail.com',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    description: "User's password",
    example: 'A234567!',
  })
  @Column()
  password: string;

  @ApiProperty({
    description: "User's firstName",
    example: 'Max',
  })
  @Column()
  firstName: string;

  @ApiProperty({
    description: "User's lastName",
    example: 'Volovo',
  })
  @Column()
  lastName: string;

  @ApiProperty({
    description: "User's phoneNumber",
    example: '+15551234567',
  })
  @Column({ unique: true })
  phoneNumber: string;

  @ApiProperty({
    description: "User's dateOfBirth",
    example: '11/11/1960',
  })
  @Column()
  dateOfBirth: string;

  @ApiProperty({
    description:
      "Indicates whether the user is open to living in a seeker's home",
    example: 'true',
    required: false,
  })
  @Column({ default: null, nullable: true })
  isOpenToSeekerHomeLiving?: boolean | null;

  @ApiProperty({
    description: 'Indicates whether the user account was verified via otp code',
    example: 'true',
    required: false,
  })
  @Column({ default: false })
  isVerified: boolean;

  @ApiProperty({
    description: "User's role",
    example: 'Caregiver',
  })
  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @ApiProperty({
    description: "User's country",
    example: 'USA',
  })
  @Column({
    type: 'enum',
    enum: Country,
  })
  country: Country;

  @ApiProperty({
    description: "User's state",
    example: 'Texas',
  })
  @Column()
  state: string;

  @ApiProperty({
    description: "User's city",
    example: 'Dallas',
  })
  @Column()
  city: string;

  @ApiProperty({
    description: "User's zipCode",
    example: '75201',
  })
  @Column()
  zipCode: string;

  @ApiProperty({
    description: "User's address",
    example: '123 Maple Street',
  })
  @Column()
  address: string;

  @ApiProperty({
    description: 'Otp code',
    example: '1234',
  })
  @Column({ default: null, nullable: true })
  otpCode?: string | null;

  @ApiProperty({
    description: 'User balance',
    example: '100',
  })
  @Column({ default: 1000, type: 'float' })
  balance: number;

  @ApiProperty({
    description: 'Link of user`s avatar',
    example: 'https://images/avatar',
  })
  @Column({ default: null, nullable: true })
  avatar: string;

  @ApiProperty({
    description: "User's status",
    example: UserStatus.Active,
  })
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.Active,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Indicates whether the user account was deleted by admin',
    example: false,
  })
  @Column({ default: false })
  isDeletedByAdmin: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => CaregiverInfo, (caregiverInfo) => caregiverInfo.user)
  caregiverInfo: CaregiverInfo;

  @OneToMany(() => Appointment, (appointment) => appointment.user)
  appointment: Appointment[];

  @OneToMany(() => TransactionHistory, (transaction) => transaction.user)
  transaction: TransactionHistory[];
}
