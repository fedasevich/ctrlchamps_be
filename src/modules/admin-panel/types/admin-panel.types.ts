import { User } from 'src/common/entities/user.entity';

export interface UserQuery {
  limit?: number;
  offset?: number;
  email?: string;
  name?: string;
}

export interface AdminListResponse {
  data: User[];
  count: number;
}
