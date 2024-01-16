import { DefaultSeekerTask } from 'src/common/entities/default-seeker-task.entity';

export type DefaultSeekerTaskQuery = {
  limit?: number;
  offset?: number;
  search?: string;
};

export interface DefaultSeekerTaskResponse {
  data: DefaultSeekerTask[];
  count: number;
}
