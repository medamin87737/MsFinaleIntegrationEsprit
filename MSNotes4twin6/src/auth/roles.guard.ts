import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { allKeycloakRoles } from './jwt-roles';
import { ROLES_KEY } from './roles.decorator';

/**
 * Vérifie {@code realm_access.roles} dans le payload JWT (req.user).
 * Si aucun décorateur @Roles n’est défini sur la route, laisse passer tout JWT valide.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const req = context.switchToHttp().getRequest();
    const roles = allKeycloakRoles(req.user as Record<string, unknown>);
    const ok = required.some((r) => roles.includes(r));
    if (!ok) {
      throw new ForbiddenException(`Rôles requis : ${required.join(', ')}`);
    }
    return true;
  }
}
