import { User } from 'src/common/entities/user.entity';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

export interface UserQuery {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface AdminListResponse {
  data: User[];
  count: number;
}

export type AdminDetails = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  updatedAt: Date;
};
