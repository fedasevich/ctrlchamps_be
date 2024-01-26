import { ApiProperty } from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MAX_RATING,
  MAX_REVIEW_LENGTH,
  MIN_RATING,
} from 'src/modules/seeker-review/seeker-review.constants';

export class CreateSeekerReviewDto {
  @ApiProperty({ description: 'The ID of the caregiver info.' })
  @IsNotEmpty()
  @IsString()
  caregiverInfoId: string;

  @ApiProperty({ description: 'The rating of the review.' })
  @IsNotEmpty()
  @IsNumber()
  @Min(MIN_RATING)
  @Max(MAX_RATING)
  rating: number;

  @ApiProperty({ description: 'The text of the review.' })
  @IsOptional()
  @MaxLength(MAX_REVIEW_LENGTH)
  @IsString()
  review: string;
}
