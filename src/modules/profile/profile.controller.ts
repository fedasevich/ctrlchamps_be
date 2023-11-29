import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Patch,
  Param,
  Get,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFile,
  UseInterceptors,
  UseGuards,
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
          new FileTypeValidator({ fileType: /(mp4|mov|avi)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('userId') userId: string,
  ): Promise<void> {
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
    @Param('userId') userId: string,
  ): Promise<CaregiverInfo | undefined> {
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
    @Param('userId') userId: string,
  ): Promise<WorkExperience[]> {
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
    @Param('userId') userId: string,
  ): Promise<Certificate[]> {
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
  async createProfile(@Param('userId') userId: string): Promise<void> {
    await this.profileService.createProfile(userId);
  }

  @Patch(ProfileApiPath.CaregiverProfile)
  @ApiOperation({ summary: 'Update caregiver profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
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
    @Param('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<void> {
    await this.profileService.updateProfile(userId, updateProfileDto);
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
    @Param('userId') userId: string,
    @Body() createCertificateDto: CreateCertificatesDto,
  ): Promise<Certificate[]> {
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
    @Param('userId') userId: string,
    @Body() workExperienceDto: CreateWorkExperienceDto,
  ): Promise<WorkExperience[]> {
    return this.profileService.createWorkExperience(userId, workExperienceDto);
  }
}
