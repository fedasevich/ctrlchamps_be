import { UserAdditionalInfo } from 'src/common/entities/user.profile.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  certificateId: string;

  @Column()
  link: string;

  @Column()
  dateIssued: Date;

  @Column()
  expirationDate: Date;

  @ManyToOne(
    () => UserAdditionalInfo,
    (userAdditionalInfo) => userAdditionalInfo.workExperiences,
  )
  userAdditionalInfo: UserAdditionalInfo;
}
