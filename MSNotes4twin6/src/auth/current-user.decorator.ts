import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extrait le payload JWT Keycloak ({@code sub}, {@code preferred_username}, {@code realm_access}, …).
 */
export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user as Record<string, unknown> | undefined;
  if (!user) {
    return undefined;
  }
  if (data) {
    return user[data];
  }
  return user;
});
