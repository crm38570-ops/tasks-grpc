import { Body, Controller, Logger, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto, UserResponseDto } from './dto';
import { JwtAccessToken } from './types/jwt-access-token.interface';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger('AuthController', { timestamp: true });

  constructor(private authService: AuthService) {}

  @Post('signup')
  signUp(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<UserResponseDto> {
    this.logger.verbose(`User "${authCredentialsDto.username}" signing up`);
    return this.authService.signUp(authCredentialsDto);
  }

  @Post('signin')
  async signIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<JwtAccessToken> {
    this.logger.verbose(`User "${authCredentialsDto.username}" signing in`);
    return this.authService.signIn(authCredentialsDto);
  }
}
