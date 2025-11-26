import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<number[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    

    // jika endpoint tidak pakai @Roles → allow semua
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || typeof user.role_id === 'undefined') {
      throw new HttpException('Unauthorized: User role missing', 401);
    }

    if (!requiredRoles.includes(user.role_id)) {
      throw new HttpException('Forbidden: You do not have access to this resource', 403);
    }

    return true;
  }
}
