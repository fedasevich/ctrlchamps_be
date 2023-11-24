import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Patch,
  Param,
  Get,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Certificate } from 'src/common/entities/certificate.entity';
import { UserAdditionalInfo } from 'src/common/entities/user.profile.entity';
import { WorkExperience } from 'src/common/entities/work-experience.entity';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { ProfileService } from 'src/modules/profile/profile.service';

import { UpdateProfileDto } from './dto/additional-info.dto';
import { CreateCertificatesDto } from './dto/create-certificate.dto';
import { CreateWorkExperienceDto } from './dto/create-work-experience.dto';
import { WorkExperienceDto } from './dto/work-experience.dto';

@ApiTags('Complete profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('/:userId')
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
  ): Promise<UserAdditionalInfo | undefined> {
    return this.profileService.getProfileInformation(userId);
  }

  @Get(':userId/work-experiences')
  @ApiOperation({ summary: 'Get work experiences of a user' })
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

  @Get('/:userId/certificates')
  @ApiOperation({ summary: 'Get user certificates' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      example: {
        certificates: [
          {
            name: 'First Aid Training',
            certificateId: 'CER12345',
            link: 'https://certificateprovider.com/certificate/123',
            dateIssued: '11/11/2020',
            expirationDate: '11/11/2020',
          },
          {
            name: 'Certificate for work with special kids',
            certificateId: 'CER12345',
            link: 'https://certificateprovider.com/certificate/123',
            dateIssued: '11/11/2020',
            expirationDate: '11/11/2020',
          },
        ],
      },
    },
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

  @Post(':userId')
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

  @Patch('/:userId')
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

  @Post('/certificate/:userId')
  @ApiOperation({ summary: 'Add certificate' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Certificate added successfully',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Certificate(s) added successfully',
    type: Certificate,
    isArray: true,
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

  @Post('/work-experience/:userId')
  @ApiOperation({ summary: 'Add work experience' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Work experience added successfully',
    schema: {
      example: {
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU0MDg5Yjg2LTYzZTctNGZhOC1iZjAwLWRhNmRkMDBkZjFmYSIsImlhdCI6MTcwMDA4MDIxOSwiZXhw',
      },
    },
    isArray: true,
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
