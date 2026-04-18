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
    if (port != null && port !== '') process.env.PORT = String(port);
    const existingMongo = process.env.MONGODB_URI?.trim();
    if (!existingMongo) {
      const mongo =
        merged['spring.data.mongodb.uri'] ?? merged['MONGODB_URI'];
      if (mongo != null && mongo !== '') process.env.MONGODB_URI = String(mongo);
    }
    const welcome = merged['welcome.message'];
    if (typeof welcome === 'string') process.env.WELCOME_MESSAGE = welcome;
    if (!process.env.KEYCLOAK_ISSUER?.trim()) {
      const keycloakIssuer = merged['keycloak.issuer-uri'];
      if (keycloakIssuer != null && keycloakIssuer !== '') {
        process.env.KEYCLOAK_ISSUER = String(keycloakIssuer);
      }
    }
    if (!process.env.KEYCLOAK_JWT_AUDIENCE?.trim()) {
      const keycloakAudience = merged['keycloak.jwt-audience'];
      if (keycloakAudience != null && keycloakAudience !== '') {
        process.env.KEYCLOAK_JWT_AUDIENCE = String(keycloakAudience);
      }
    }
  } catch {
    logger.warn(
      `Config Server at ${baseUrl} unavailable; using PORT / MONGODB_URI env or defaults.`,
    );
  }
}
