import { ApiProperty } from '@nestjs/swagger';

import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CertificateItem {
  @ApiProperty({
    description: 'Name of the certificate',
    example: 'First Aid Training',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Certificate ID',
    example: 'CER12345',
  })
  @IsNotEmpty()
  @IsString()
  certificateId: string;

  @ApiProperty({
    description: 'Link to the certificate document',
    example: 'https://certificateprovider.com/certificate/123',
  })
  @IsNotEmpty()
  @IsString()
  link: string;

  @ApiProperty({
    description: 'Date the certificate was issued',
    example: '2020-11-11',
  })
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  dateIssued: Date;

  @ApiProperty({
    description: 'Expiration date of the certificate',
    example: '2021-11-11',
  })
  @Transform(({ value }) => (value ? new Date(value) : null))
  expirationDate: Date | null;
}
