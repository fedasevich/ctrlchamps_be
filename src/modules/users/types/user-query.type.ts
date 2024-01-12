import { SortOrder } from 'src/modules/users/enums/sort-query.enum';

export type UserQuery = {
  limit?: number;
  offset?: number;
  search?: string;
  sort?: SortOrder;
};
