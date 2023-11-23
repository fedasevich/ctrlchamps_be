import { ApiProperty } from '@nestjs/swagger';

import { UserAdditionalInfo } from 'src/common/entities/user.profile.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Certificate {
  @ApiProperty({
    description: 'Unique identifier for the certificate',
    example: 'b87f2f7c-6382-4a81-b285-d8f9c5b8d6c3',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Name of the certificate',
    example: 'First Aid Training',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Certificate ID',
    example: 'CER12345',
  })
  @Column()
  certificateId: string;

  @ApiProperty({
    description: 'Link to the certificate document',
    example: 'https://certificateprovider.com/certificate/123',
  })
  @Column()
  link: string;

  @ApiProperty({
    description: 'Date the certificate was issued',
    example: '11/11/2020',
  })
  @Column()
  dateIssued: string;

  @ApiProperty({
    description: 'Expiration date of the certificate',
    example: '11/11/2020',
  })
  @Column({ nullable: true })
  expirationDate: string;

  @ApiProperty({
    description: 'Link to the user additional information',
  })
  @ManyToOne(
    () => UserAdditionalInfo,
    (userAdditionalInfo) => userAdditionalInfo.workExperiences,
  )
  userAdditionalInfo: UserAdditionalInfo;
}
