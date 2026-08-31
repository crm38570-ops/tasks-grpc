import { Controller, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto, UserResponseDto } from './dto';
import { GrpcMethod } from '@nestjs/microservices';
import { JwtAccessTokenDto } from './dto/jwt-access-token.dto';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
} from '../proto/auth/generated/auth_service';

@Controller('auth')
@AuthServiceControllerMethods()
export class AuthController implements AuthServiceController {
  private readonly logger = new Logger('AuthController', { timestamp: true });

  constructor(private authService: AuthService) {}

  @GrpcMethod('AuthService', 'SignUp')
  signUp(authCredentialsDto: AuthCredentialsDto): Promise<UserResponseDto> {
    this.logger.verbose(`User "${authCredentialsDto.username}" signing up`);
    return this.authService.signUp(authCredentialsDto);
  }

  @GrpcMethod('AuthService', 'SignIn')
  async signIn(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<JwtAccessTokenDto> {
    this.logger.verbose(`User "${authCredentialsDto.username}" signing in`);
    return this.authService.signIn(authCredentialsDto);
  }
}
