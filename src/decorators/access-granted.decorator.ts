import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const IS_ACCESS_GRANTED_KEY = 'isPublic';

export const AccessWithoutToken = (): CustomDecorator<string> =>
  SetMetadata(IS_ACCESS_GRANTED_KEY, true);
