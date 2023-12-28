import { SetMetadata } from '@nestjs/common';

export const IS_ACCESS_GRANTED_KEY = 'isPublic';
export const AccessWithoutToken = () =>
  SetMetadata(IS_ACCESS_GRANTED_KEY, true);
