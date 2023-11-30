import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Capability } from 'src/common/entities/capability.entity';
import { ApiPath } from 'src/common/enums/api-path.enum';
import { ErrorMessage } from 'src/common/enums/error-message.enum';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';
import { CapabilityApiPath } from 'src/modules/capability/enums/capability.api-path.enum';

import { CapabilityService } from './capability.service';

@ApiTags('Capability')
@Controller(ApiPath.Capability)
@UseGuards(TokenGuard)
export class CapabilityController {
  constructor(private readonly capabilityService: CapabilityService) {}

  @ApiOperation({ summary: 'Get all capabilities' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Capabilities were sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ErrorMessage.FailedSendCapabilities,
  })
  @Get(CapabilityApiPath.Root)
  findAll(): Promise<Capability[]> {
    return this.capabilityService.findAll();
  }
}
