import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, hasPermission } from '../../auth/interface/auth.interface';
export { Roles } from '../decorators/roles.decorator';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (resource: string, action: string) =>
  SetMetadata(PERMISSIONS_KEY, { resource, action });

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [
      context.getHandler(),
      context.getClass(),
    ]);
    
    const requiredPermission = this.reflector.getAllAndOverride<{resource: string, action: string}>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles && !requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check role-based access
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    // Check permission-based access
    if (requiredPermission) {
      const hasAccess = hasPermission(user.role, requiredPermission.resource, requiredPermission.action);
      if (!hasAccess) {
        throw new ForbiddenException(
          `Access denied. Required permission: ${requiredPermission.action} on ${requiredPermission.resource}`
        );
      }
    }

    return true;
  }
}

@Injectable()
export class WilayahAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      return false;
    }

    // Admin dapat mengakses semua wilayah
    if (user.role === UserRole.ADMIN || user.wilayahKerja?.includes('all')) {
      return true;
    }

    // Periksa akses wilayah berdasarkan parameter request
    const { provinsiId, kotaId, kecamatanId } = request.query;
    const areaToCheck = kecamatanId || kotaId || provinsiId;
    
    if (areaToCheck && user.wilayahKerja) {
      return user.wilayahKerja.includes(areaToCheck);
    }

    return true; // Jika tidak ada filter wilayah spesifik
  }
}
