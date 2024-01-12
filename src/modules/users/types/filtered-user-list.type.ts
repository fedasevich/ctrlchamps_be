import { User } from 'src/common/entities/user.entity';

export type FilteredUserList = {
  data: User[];
  count: number;
};
