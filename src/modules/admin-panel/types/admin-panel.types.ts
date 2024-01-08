import { User } from 'src/common/entities/user.entity';

export interface UserQuery {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface AdminListResponse {
  data: User[];
  count: number;
}
