import {
    CanActivate,
    ExecutionContext,
    Injectable,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { IS_PUBLIC_KEY } from './public.decorator';
  import { PERMISSIONS_KEY } from './permissions.decorator';
  import { RolePermissions } from './permissions.config';
  
  @Injectable()
  export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
      // Skip permission checks for @Public routes
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );
  
      if (isPublic) {
        return true;
      }
  
      const requiredPermissions =
        this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
  
      // If no @RequirePermissions on the route, allow
      if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
      }
  
      const request = context.switchToHttp().getRequest();
      const user = request.user as { role?: string };
  
      if (!user?.role) {
        return false;
      }
  
      const userPermissions =
        RolePermissions[user.role as keyof typeof RolePermissions] ?? [];
  
      return requiredPermissions.every((perm) =>
        userPermissions.includes(perm),
      );
    }
  }
  