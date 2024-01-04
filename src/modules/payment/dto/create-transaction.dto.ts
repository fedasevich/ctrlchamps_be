import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsUUID, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

import { TransactionType } from '../enums/transaction-type.enum';

export class CreateTransactionDto {
  @ApiProperty({
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
    description: 'User ID associated with the transaction',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    example: '1e3a4c60-94aa-45de-aad0-7b4a49017b1f',
    description: 'Appointment ID associated with the transaction',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @ApiProperty({
    enum: TransactionType,
    description: 'Type of the transaction',
  })
  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Amount of transaction',
    example: '50',
  })
  @IsNotEmpty()
  @IsInt()
  amount: number;
}
