import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

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

    const email = payload.email || `${payload.sub}@auth0.local`;

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
        roles.find((r: string) => ['student', 'alumni', 'staff', 'admin'].includes(r)) ||
        'student',
    };
  }
}
