import { ApiProperty } from '@nestjs/swagger';

import { OtpPurpose } from 'src/modules/otp-code/enums/otp-purpose.enum';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// eslint-disable-next-line import/no-cycle
import { User } from './user.entity';

@Entity()
export class OtpCode {
  @ApiProperty({
    description: "Otp code's id",
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Otp code',
    example: '1234',
  })
  @Column()
  code: string;

  @ApiProperty({
    description: "Otp code's purpose",
    example: 'reset_password',
  })
  @Column({
    type: 'enum',
    enum: OtpPurpose,
  })
  purpose: OtpPurpose;

  @ApiProperty({
    description: "Otp code's foreign key user id",
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
  })
  @Column()
  userId: string;

  @ApiProperty({
    type: () => User,
    description: 'The user associated with this OTP code',
  })
  @ManyToOne(() => User, (user) => user.otpCodes)
  user: User;
}
