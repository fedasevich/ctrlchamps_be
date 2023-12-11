import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { AppointmentStatus } from 'src/modules/appointment/enums/appointment-status.enum';
import { TokenGuard } from 'src/modules/auth/middleware/auth.middleware';
import { AuthenticatedRequest } from 'src/modules/auth/types/user.request.type';

import {
  APPOINTMENT_EXAMPLE,
  APPOINTMENTS_EXAMPLE,
} from './appointment.constants';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

describe('AppointmentController', () => {
  let controller: AppointmentController;
  let mockAppointmentService;

  beforeEach(async () => {
    mockAppointmentService = {
      findAllByUserId: jest.fn(() => APPOINTMENTS_EXAMPLE),
      findOneById: jest.fn(() => APPOINTMENT_EXAMPLE),
      updateById: jest.fn(),
      findAllByDate: jest.fn(() => APPOINTMENTS_EXAMPLE),
    };

    const mockAuthGuard = { canActivate: jest.fn(() => true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentController],
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentService },
        { provide: TokenGuard, useValue: mockAuthGuard },
      ],
      imports: [JwtModule.register({ secret: 'very_secret_key' })],
    }).compile();

    controller = module.get<AppointmentController>(AppointmentController);
  });

  describe('getAll', () => {
    it('should return an array of appointments', async () => {
      const id = 'testId';
      const result = await controller.getAll({
        user: { id },
      } as AuthenticatedRequest);

      expect(mockAppointmentService.findAllByUserId).toHaveBeenCalledWith(id);
      expect(result).toEqual(APPOINTMENTS_EXAMPLE);
    });
  });

  describe('getAllByDate', () => {
    it('should return an array of appointments', async () => {
      const id = 'testId';
      const date = '2023-12-13';
      const result = await controller.getAllByDate(
        {
          user: { id },
        } as AuthenticatedRequest,
        date,
      );

      expect(mockAppointmentService.findAllByDate).toHaveBeenCalledWith(
        id,
        date,
      );
      expect(result).toEqual(APPOINTMENTS_EXAMPLE);
    });
  });

  describe('getOne', () => {
    it('should return a single appointment', async () => {
      const appointmentId = 'testId';
      const result = await controller.getOne(appointmentId);

      expect(mockAppointmentService.findOneById).toHaveBeenCalledWith(
        appointmentId,
      );
      expect(result).toEqual(APPOINTMENT_EXAMPLE);
    });
  });

  describe('update', () => {
    it('should update an appointment', async () => {
      const appointmentId = 'testId';
      const updateDto: UpdateAppointmentDto = {
        status: AppointmentStatus.Accepted,
      };

      await expect(
        controller.update(appointmentId, updateDto),
      ).resolves.not.toThrow();

      expect(mockAppointmentService.updateById).toHaveBeenCalledWith(
        appointmentId,
        updateDto,
      );
    });
  });
});
