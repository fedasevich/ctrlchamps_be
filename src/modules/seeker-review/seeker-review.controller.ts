import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { AllowedRoles } from 'src/decorators/roles-auth.decorator';
import { AuthenticatedRequest } from 'src/modules/auth/types/user.request.type';
import { REVIEW_EXAMPLE } from 'src/modules/seeker-review/seeker-review.constants';
import { ReviewQuery } from 'src/modules/seeker-review/types/review-query.type';
import { ReviewsByUserId } from 'src/modules/seeker-review/types/reviews-by-user-id.type';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

import { TokenGuard } from '../auth/middleware/auth.middleware';

import { CreateSeekerReviewDto } from './dto/create-seeker-review.dto';
import { SeekerReviewApiPath } from './seeker-review.api-path.enum';
import { SeekerReviewService } from './seeker-review.service';

@ApiTags('Seeker Review')
@UseGuards(TokenGuard)
@Controller(ApiPath.SeekerReview)
export class SeekerReviewController {
  constructor(private readonly seekerReviewService: SeekerReviewService) {}

  @ApiOperation({ summary: 'Seeker review creating' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Seeker review was created successfully',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.FailedCreateSeekerReview,
  })
  @Post(SeekerReviewApiPath.Root)
  @AllowedRoles(UserRole.Seeker)
  async create(
    @Body() createSeekerReviewDto: CreateSeekerReviewDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }

    return this.seekerReviewService.create(createSeekerReviewDto, userId);
  }

  @ApiOperation({ summary: 'Delete seeker review by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Seeker review was deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.SeekerReviewNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.FailedDeleteSeekerReview,
  })
  @Delete(SeekerReviewApiPath.Id)
  @AllowedRoles(UserRole.Admin, UserRole.SuperAdmin)
  async deleteSeekerReview(@Param('id') id: string): Promise<void> {
    return this.seekerReviewService.delete(id);
  }

  @Get(SeekerReviewApiPath.Id)
  @AllowedRoles(UserRole.SuperAdmin, UserRole.Admin)
  @ApiOperation({ summary: 'Get reviews by user id' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of items to skip',
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fetched reviews successfully',
    schema: {
      example: [REVIEW_EXAMPLE],
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: ErrorMessage.ForbiddenResource,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.FailedFetchReviews,
  })
  async getAllByUserId(
    @Query() query: ReviewQuery,
    @Param('id') userId: string,
  ): Promise<ReviewsByUserId> {
    return this.seekerReviewService.getAllByUserId(query, userId);
  }
}
