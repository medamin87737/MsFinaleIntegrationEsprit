import { Logger } from '@nestjs/common';

const logger = new Logger('ConfigServerBootstrap');

type ConfigResponse = {
  propertySources?: Array<{ source?: Record<string, unknown> }>;
};

function mergePropertySources(body: ConfigResponse): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  const list = body.propertySources ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    Object.assign(merged, list[i].source);
  }
  return merged;
}

/**
 * Résout les placeholders Spring style `${VAR:default}` renvoyés par Config Server.
 * Sans cette étape, on injecte littéralement la chaîne et certaines configs (issuer JWT) cassent.
 */
function resolveSpringPlaceholder(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s.startsWith('${') || !s.endsWith('}')) return s;
  const inner = s.slice(2, -1);
  const sep = inner.indexOf(':');
  const envKey = sep >= 0 ? inner.slice(0, sep) : inner;
  const fallback = sep >= 0 ? inner.slice(sep + 1) : '';
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) return fromEnv;
  return fallback.trim() || null;
}

/**
 * Loads MSNotes4twin6 config from Spring Cloud Config before Nest bootstrap so PORT and Mongo apply in time.
 */
export async function applySpringCloudEnv(
  appName = 'MSNotes4twin6',
  baseUrl = process.env.CONFIG_SERVER_URL ?? 'http://localhost:8888',
): Promise<void> {
  try {
    const res = await fetch(`${baseUrl}/${appName}/default`);
    if (!res.ok) return;
    const body = (await res.json()) as ConfigResponse;
    const merged = mergePropertySources(body);
    const port = merged['server.port'];
    const resolvedPort = resolveSpringPlaceholder(port);
    if (resolvedPort) process.env.PORT = resolvedPort;
    const existingMongo = process.env.MONGODB_URI?.trim();
    if (!existingMongo) {
      const mongo =
        merged['spring.data.mongodb.uri'] ?? merged['MONGODB_URI'];
      const resolvedMongo = resolveSpringPlaceholder(mongo);
      if (resolvedMongo) process.env.MONGODB_URI = resolvedMongo;
    }
    const welcome = merged['welcome.message'];
    if (typeof welcome === 'string') process.env.WELCOME_MESSAGE = welcome;
    if (!process.env.KEYCLOAK_ISSUER?.trim()) {
      const keycloakIssuer = merged['keycloak.issuer-uri'];
      const resolvedIssuer = resolveSpringPlaceholder(keycloakIssuer);
      if (resolvedIssuer) process.env.KEYCLOAK_ISSUER = resolvedIssuer;
    }
    if (!process.env.KEYCLOAK_JWT_AUDIENCE?.trim()) {
      const keycloakAudience = merged['keycloak.jwt-audience'];
      const resolvedAudience = resolveSpringPlaceholder(keycloakAudience);
      if (resolvedAudience) process.env.KEYCLOAK_JWT_AUDIENCE = resolvedAudience;
    }
    if (!process.env.GATEWAY_BASE_URL?.trim()) {
      const gw = merged['GATEWAY_BASE_URL'];
      const resolvedGw = resolveSpringPlaceholder(gw);
      if (resolvedGw) process.env.GATEWAY_BASE_URL = resolvedGw;
    }
  } catch {
    logger.warn(
      `Config Server at ${baseUrl} unavailable; using PORT / MONGODB_URI env or defaults.`,
    );
  }
}
