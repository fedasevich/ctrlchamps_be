import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CaregiverInfo } from 'src/common/entities/caregiver.profile.entity';
import { Certificate } from 'src/common/entities/certificate.entity';
import { WorkExperience } from 'src/common/entities/work-experience.entity';
import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';
import { Token } from 'src/modules/auth/types/token.type';
import { AuthenticatedRequest } from 'src/modules/auth/types/user.request.type';
import { ProfileApiPath } from 'src/modules/profile/enum/profile.enum';
import { ProfileService } from 'src/modules/profile/profile.service';

import {
  CERTIFICATES_EXAMPLE,
  MAX_FILE_SIZE,
  WORK_EXPERIENCE_EXAMPLE,
} from './constants/complete-profile.constants';
import { UpdateProfileDto } from './dto/additional-info.dto';
import { CertificateItem } from './dto/certificate.dto';
import { CreateCertificatesDto } from './dto/create-certificate.dto';
import { CreateWorkExperienceDto } from './dto/create-work-experience.dto';
import { WorkExperienceDto } from './dto/work-experience.dto';

@ApiTags('Complete profile')
@Controller(ApiPath.CompleteProfile)
@UseGuards(TokenGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post(ProfileApiPath.UploadFile)
  @ApiOperation({ summary: 'Upload a video for caregiver profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File uploaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.BacketNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: '.(mp4|quicktime|x-msvideo)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }
    await this.profileService.upload(file.originalname, file.buffer, userId);
  }

  @Get(ProfileApiPath.CaregiverProfile)
  @ApiOperation({ summary: 'Get caregiver profile information' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UpdateProfileDto,
    description: 'Caregiver profile information retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Caregiver profile not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  async getProfileInformation(
    @Req() request: AuthenticatedRequest,
  ): Promise<CaregiverInfo | undefined> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }

    return this.profileService.getProfileInformation(userId);
  }

  @Get(ProfileApiPath.WorkExperience)
  @ApiOperation({ summary: 'Get work experience(s) of a caregiver' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Work experiences fetched successfully',
    type: WorkExperienceDto,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User profile not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  async getWorkExperiences(
    @Req() request: AuthenticatedRequest,
  ): Promise<WorkExperience[]> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }

    return this.profileService.getWorkExperiences(userId);
  }

  @Get(ProfileApiPath.Certificates)
  @ApiOperation({ summary: `Get caregiver's certificate(s)` })
  @ApiResponse({
    status: HttpStatus.OK,
    isArray: true,
    type: CertificateItem,
    description: 'User certificates retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User profile or certificates not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  async getUserCertificates(
    @Req() request: AuthenticatedRequest,
  ): Promise<Certificate[]> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }

    return this.profileService.getUserCertificates(userId);
  }

  @Post(ProfileApiPath.CaregiverProfile)
  @ApiOperation({ summary: 'Create caregiver profile' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Caregiver profile created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.UserProfileAlreadyExists,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.UserProfileNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  async createProfile(@Req() request: AuthenticatedRequest): Promise<void> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }
    await this.profileService.createProfile(userId);
  }

  @Patch(ProfileApiPath.CaregiverProfile)
  @ApiOperation({ summary: 'Update caregiver profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully with token',
    schema: {
      example: {
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU0MDg5Yjg2LTYzZTctNGZhOC1iZjAwLWRhNmRkMDBkZjFmYSIsImlhdCI6MTcwMDA4MDIxOSwiZXhw',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Profile updated successfully with no content',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ErrorMessage.UserProfileAlreadyExists,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ErrorMessage.UserProfileNotFound,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Token | void> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }

    return this.profileService.updateProfile(userId, updateProfileDto);
  }

  @Post(ProfileApiPath.Certificates)
  @ApiOperation({ summary: 'Add certificate(s)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Certificate(s) added successfully',
    schema: {
      example: CERTIFICATES_EXAMPLE,
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Caregiver profile not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  addCertificate(
    @Req() request: AuthenticatedRequest,
    @Body() createCertificateDto: CreateCertificatesDto,
  ): Promise<Certificate[]> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }

    return this.profileService.createCertificate(userId, createCertificateDto);
  }

  @Post(ProfileApiPath.WorkExperience)
  @ApiOperation({ summary: 'Add work experience(s)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Work experience added successfully',
    schema: {
      example: WORK_EXPERIENCE_EXAMPLE,
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Caregiver profile not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.InternalServerError,
  })
  addWorkExperience(
    @Req() request: AuthenticatedRequest,
    @Body() workExperienceDto: CreateWorkExperienceDto,
  ): Promise<WorkExperience[]> {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException(ErrorMessage.UserIsNotAuthorized);
    }

    return this.profileService.createWorkExperience(userId, workExperienceDto);
  }
}
