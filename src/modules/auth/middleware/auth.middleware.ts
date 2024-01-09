import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { Observable } from 'rxjs';
import { IS_ACCESS_GRANTED_KEY } from 'src/decorators/access-granted.decorator';
import { ALLOWED_ROLES_KEY } from 'src/decorators/roles-auth.decorator';
import { AuthenticatedRequest } from 'src/modules/auth/types/user.request.type';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

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
      const decodedToken =
        this.jwtService.verify<AuthenticatedRequest['user']>(token);
      request.user = decodedToken;

      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
        ALLOWED_ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredRoles) {
        return requiredRoles.includes(decodedToken.role);
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}
