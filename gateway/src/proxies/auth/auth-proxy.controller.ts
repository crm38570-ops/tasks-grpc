import { Body, Controller, Logger, Post } from '@nestjs/common';
import { AuthProxyService } from './auth-proxy.service';
import { SignUpDto, SignInDto } from './dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthProxyController {
  private readonly logger = new Logger('AuthProxyController', {
    timestamp: true,
  });

  constructor(private readonly authProxyService: AuthProxyService) {}

  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь зарегистрирован' })
  @ApiResponse({ status: 400, description: 'Некорректные данные регистрации' })
  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto) {
    this.logger.verbose('Sign up request received');
    return this.authProxyService.signUp(signUpDto);
  }

  @ApiOperation({ summary: 'Авторизация пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь авторизован' })
  @ApiResponse({ status: 400, description: 'Некорректные данные авторизации' })
  @Post('signin')
  signIn(@Body() signInDto: SignInDto) {
    this.logger.verbose('Sign in request received');
    return this.authProxyService.signIn(signInDto);
  }
}
