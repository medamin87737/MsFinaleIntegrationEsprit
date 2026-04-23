import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const issuer =
      process.env.KEYCLOAK_ISSUER ??
      config.get<string>('KEYCLOAK_ISSUER') ??
      'http://localhost:8180/realms/school-realm';
    const jwksUri =
      process.env.KEYCLOAK_JWKS_URI?.trim() ||
      `${issuer.replace(/\/$/, '')}/protocol/openid-connect/certs`;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer,
      /** Keycloak peut émettre plusieurs audiences ; on valide l'issuer + la signature uniquement. */
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri,
      }),
    });
  }

  validate(payload: Record<string, unknown>) {
    return payload;
  }
}
