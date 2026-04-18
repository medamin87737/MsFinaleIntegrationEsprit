import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Rôles realm Keycloak requis (ex: ROLE_CHEF_ENSEIGNANT). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
