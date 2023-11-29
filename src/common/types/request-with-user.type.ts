import { Request } from 'express';
import { DecodedToken } from 'src/common/types/decoded-token.type';

export type RequestWithUser = Request & {
  user: DecodedToken;
};
