import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './types/jwt.payload.interface';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  validate(payload: JwtPayload) {
    const { userId } = payload;

    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Дальше запрос в auth-service POST auth/internal/verifyUser
    return payload; //Временно
  }
}
