import { JwtAccessToken } from '../types/jwt-access-token.interface';

export class JwtAccessTokenDto implements JwtAccessToken {
  accessToken: string;
}
