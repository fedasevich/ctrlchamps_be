import { ApiProperty } from '@nestjs/swagger';

import { Country } from 'modules/users/enums/country.enum';
import { UserRole } from 'modules/users/enums/user-role.enum';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

// eslint-disable-next-line import/no-cycle
import { OtpCode } from './otp-code.entity';

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
      "Indicates whether the user is open to living in a client's home",
    example: 'true',
    required: false,
  })
  @Column({ default: null, nullable: true })
  isOpenToClientHomeLiving?: boolean | null;

  @ApiProperty({
    description: 'Indicates whether the user account was verified via otp code',
    example: 'true',
    required: false,
  })
  @Column({ default: null, nullable: true })
  isVerified?: boolean | null;

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

  @ApiProperty({ type: () => OtpCode, isArray: true })
  @OneToMany(() => OtpCode, (otpCode) => otpCode.user)
  otpCodes: OtpCode[];
}
