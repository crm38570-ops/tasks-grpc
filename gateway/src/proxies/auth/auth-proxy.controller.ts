import { Body, Controller, Logger, Post } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { map } from 'rxjs';
import { AxiosResponse } from 'axios';

@ApiTags('Auth')
@Controller('auth')
export class AuthProxyController {
  private readonly logger = new Logger('AuthProxyController', {
    timestamp: true,
  });
  private readonly authServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.authServiceUrl = config.getOrThrow('AUTH_SERVICE_URL');
  }

  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь зарегистрирован' })
  @ApiResponse({ status: 400, description: 'Некорректные данные регистрации' })
  @Post('signup')
  signUp(@Body() body: unknown) {
    this.logger.verbose('Sign up request received');
    return this.http
      .post(`${this.authServiceUrl}/auth/signup`, body)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @ApiOperation({ summary: 'Авторизация пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь авторизован' })
  @ApiResponse({ status: 400, description: 'Некорректные данные авторизации' })
  @Post('signin')
  signIn(@Body() body: unknown) {
    this.logger.verbose('Sign in request received');
    return this.http
      .post(`${this.authServiceUrl}/auth/signin`, body)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }
}
