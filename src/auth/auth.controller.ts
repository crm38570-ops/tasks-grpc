import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto';
import { JwtAccessToken } from './types/jwt-access-token.interface';
import { User } from './user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authServise: AuthService) {}

  @Post('signup')
  async signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<User> {
    return this.authServise.signUp(authCredentialsDto);
  }

  @Post('signin')
  async signIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<JwtAccessToken> {
    return this.authServise.signIn(authCredentialsDto);
  }
}
