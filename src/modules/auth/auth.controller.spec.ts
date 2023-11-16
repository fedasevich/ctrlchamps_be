// auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';

import { Country } from '../users/enums/country.enum';
import { UserRole } from '../users/enums/user-role.enum';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountCheckDto } from './dto/account-check.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserCreateDto } from './dto/user-create.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService;

  beforeEach(async () => {
    mockAuthService = {
      signUp: jest.fn(() => ({ token: 'my_token' })),
      accountCheck: jest.fn(),
      resetPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('controller should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should return user token', async () => {
      const userDto: UserCreateDto = {
        email: 'user@gmail.com',
        password: 'A234567!',
        firstName: 'Max',
        lastName: 'Volovo',
        phoneNumber: '+15551234567',
        dateOfBirth: '11/11/1960',
        isOpenToSeekerHomeLiving: true,
        role: UserRole.Caregiver,
        country: Country.USA,
        state: 'Texas',
        city: 'Dallas',
        zipCode: '75201',
        address: '123 Maple Street',
      };
      const result = await controller.signUp(userDto);
      expect(result).toEqual({ token: 'my_token' });
      expect(mockAuthService.signUp).toHaveBeenCalledWith(userDto);
    });
  });

  describe('accountCheck', () => {
    it('should not throw error', async () => {
      const accountDto: AccountCheckDto = {
        email: 'user@gmail.com',
        phoneNumber: '+15551234567',
      };
      await expect(controller.accountCheck(accountDto)).resolves.not.toThrow();
      expect(mockAuthService.accountCheck).toHaveBeenCalledWith(accountDto);
    });
  });

  describe('resetPassword', () => {
    it('should not throw error', async () => {
      const resetDto: ResetPasswordDto = {
        email: 'user@gmail.com',
        password: 'A234567!',
      };
      await expect(controller.resetPassword(resetDto)).resolves.not.toThrow();
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetDto);
    });
  });
});
