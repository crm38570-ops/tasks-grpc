import { Body, Controller, Logger, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto';
import { JwtAccessToken } from './types/jwt-access-token.interface';
import { User } from './user.entity';

@Controller('auth')
export class AuthController {
  private logger = new Logger(`AuthController`);

  constructor(private authServise: AuthService) {}

  @Post('signup')
  async signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<User> {
    this.logger.verbose(`User "${authCredentialsDto.username}" signing up`);
    return this.authServise.signUp(authCredentialsDto);
  }

  @Post('signin')
  async signIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<JwtAccessToken> {
    this.logger.verbose(`User "${authCredentialsDto.username}" signing in`);
    return this.authServise.signIn(authCredentialsDto);
  }
}
