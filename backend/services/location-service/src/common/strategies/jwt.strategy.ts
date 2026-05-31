import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET', 'super-secret-key'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string; role: string; phone: string }) {
    return { id: payload.sub, role: payload.role, phone: payload.phone };
  }
}
