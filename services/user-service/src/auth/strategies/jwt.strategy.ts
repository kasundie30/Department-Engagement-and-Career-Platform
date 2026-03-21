import { Injectable } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

/**
 * Auth0 JWT verification strategy.
 * Fetches the RS256 public key from Auth0's JWKS endpoint automatically.
 * Required env vars:
 *   AUTH0_DOMAIN   — e.g. "your-tenant.auth0.com"
 *   AUTH0_AUDIENCE — e.g. "https://api.yourdomain.com"
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const domain = process.env.AUTH0_DOMAIN || '';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: process.env.AUTH0_AUDIENCE,
      issuer: domain ? `https://${domain}/` : undefined,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `https://${domain}/.well-known/jwks.json`,
      }),
    });
  }

  async validate(payload: any) {
    const name =
      payload.name ||
      [payload.given_name, payload.family_name].filter(Boolean).join(' ') ||
      payload.nickname ||
      payload.email ||
      payload.sub ||
      'Unknown User';

    const email =
      payload.email ||
      `${payload.sub}@auth0.local`;

    // Auth0 stores custom roles in a namespace claim (configured in Auth0 Actions/Rules)
    // Convention: https://your-domain.auth0.com/roles claim contains roles array
    const roles: string[] =
      payload[`${process.env.AUTH0_AUDIENCE}/roles`] ||
      payload['https://department-platform/roles'] ||
      payload['https://api.decp.com/roles'] ||
      [];

    return {
      sub: payload.sub,
      email,
      name,
      role:
        roles.find((r: string) => ['student', 'alumni', 'admin'].includes(r)) ||
        'student',
    };
  }
}
