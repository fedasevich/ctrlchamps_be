import { UserStatus } from 'src/modules/users/enums/user-status.enum';

export const MAX_FILE_SIZE = 5242880;

export const USER_INFO_EXAMPLE = {
  id: '2f09b807-72ee-49ea-83d2-17b7746957a2',
  email: 'user@gmail.com',
  firstName: 'Max',
  lastName: 'Volovo',
  phoneNumber: '+15551234567',
  dateOfBirth: '11/11/1960',
  isOpenToSeekerHomeLiving: true,
  isVerified: true,
  role: 'Caregiver',
  country: 'USA',
  state: 'Texas',
  city: 'Dallas',
  zipCode: '12345',
  address: '123 Maple Street',
  balance: 100,
  avatar: 'https://images/avatar',
  status: UserStatus.Active,
  isDeletedByAdmin: false,
  createdAt: '2024-01-09 16:24:14.963807',
};

export const DEFAULT_PAGINATION_LIMIT = 6;

export const DEFAULT_OFFSET = 0;
