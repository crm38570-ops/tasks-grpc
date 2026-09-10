import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './types/jwt.payload.interface';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthProxyService } from './auth-proxy.service';
import { isUUID } from 'class-validator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authProxyService: AuthProxyService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload) {
    const { userId } = payload;

    if (!userId || !isUUID(userId, '4')) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const response = await this.authProxyService.verifyUser(userId);

    if (!response.valid) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    return payload;
  }
}
