import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { AllowedRoles } from 'src/decorators/roles-auth.decorator';
import { AuthenticatedRequest } from 'src/modules/auth/types/user.request.type';
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
}
