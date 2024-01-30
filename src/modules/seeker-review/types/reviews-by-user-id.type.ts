import { SeekerReview } from 'src/common/entities/seeker-reviews.entity';

export type ReviewsByUserId = {
  data: SeekerReview[];
  count: number;
};
