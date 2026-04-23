/**
 * Rôles Keycloak : {@code realm_access.roles} + rôles client dans {@code resource_access.*.roles}.
 * Certains tokens n'exposent les rôles métier que côté client.
 */
export function allKeycloakRoles(user: Record<string, unknown> | undefined): string[] {
  const out = new Set<string>();
  const ra = user?.realm_access as { roles?: string[] } | undefined;
  ra?.roles?.forEach((r) => out.add(r));
  const rc = user?.resource_access as Record<string, { roles?: string[] }> | undefined;
  if (rc) {
    for (const v of Object.values(rc)) {
      v?.roles?.forEach((r) => out.add(r));
    }
  }
  const list = [...out];
  if (list.includes('ROLE_ADMIN') && !list.includes('ROLE_CHEF_ENSEIGNANT')) {
    list.push('ROLE_CHEF_ENSEIGNANT');
  }
  return list;
}
