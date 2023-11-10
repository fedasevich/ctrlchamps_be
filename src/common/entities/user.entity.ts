import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

import { Country, UserRole } from '../enums/enums';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column()
  dateOfBirth: string;

  @Column()
  preferredLanguage: string;

  @Column()
  isOpenToClientHomeLiving: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: Country,
  })
  country: Country;

  @Column()
  state: string;

  @Column()
  city: string;

  @Column()
  zipCode: number;

  @Column()
  address: string;
}
