import { Body, Controller, Logger, Post } from '@nestjs/common';
import { AuthProxyService } from './auth-proxy.service';
import { SignUpDto, SignInDto } from './dto';
import { SignUpApi, SignInApi } from './swagger';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthProxyController {
  private readonly logger = new Logger('AuthProxyController', {
    timestamp: true,
  });

  constructor(private readonly authProxyService: AuthProxyService) {}

  @SignUpApi()
  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto) {
    this.logger.verbose('Sign up request received');
    return this.authProxyService.signUp(signUpDto);
  }

  @SignInApi()
  @Post('signin')
  signIn(@Body() signInDto: SignInDto) {
    this.logger.verbose('Sign in request received');
    return this.authProxyService.signIn(signInDto);
  }
}
