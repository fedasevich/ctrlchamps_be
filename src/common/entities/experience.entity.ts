import { UserAdditionalInfo } from 'src/common/entities/user.profile.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class WorkExperience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workplace: string;

  @Column()
  workType: string;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @ManyToOne(
    () => UserAdditionalInfo,
    (userAdditionalInfo) => userAdditionalInfo.workExperiences,
  )
  userAdditionalInfo: UserAdditionalInfo;
}
