import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { Observable } from 'rxjs';
import { IS_ACCESS_GRANTED_KEY } from 'src/decorators/access-granted.decorator';

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const accessGranted = this.reflector.getAllAndOverride<boolean>(
      IS_ACCESS_GRANTED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (accessGranted) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      return false;
    }

    try {
      const decodedToken = this.jwtService.verify(token);
      request.user = decodedToken;

      return true;
    } catch (error) {
      return false;
    }
  }
}
