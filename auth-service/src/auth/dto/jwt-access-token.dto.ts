import { SignInResponse } from '../../proto/auth/generated/auth_service';

export class JwtAccessTokenDto implements SignInResponse {
  accessToken: string;
}
