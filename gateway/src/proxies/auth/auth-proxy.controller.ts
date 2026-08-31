import { Body, Controller, Logger, Post } from '@nestjs/common';
import { AuthProxyService } from './auth-proxy.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthProxyController {
  private readonly logger = new Logger('AuthProxyController', {
    timestamp: true,
  });

  constructor(private readonly authProxyService: AuthProxyService) {}

  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: {
          type: 'string',
          minLength: 2,
          maxLength: 40,
          description: 'Имя пользователя',
          example: 'Alice',
        },
        password: {
          type: 'string',
          minLength: 8,
          maxLength: 40,
          description: 'Пароль',
          example: 'Secret123!',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Пользователь зарегистрирован' })
  @ApiResponse({ status: 400, description: 'Некорректные данные регистрации' })
  @Post('signup')
  signUp(@Body() body: { username: string; password: string }) {
    this.logger.verbose('Sign up request received');
    return this.authProxyService.signUp(body);
  }

  @ApiOperation({ summary: 'Авторизация пользователя' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: {
          type: 'string',
          minLength: 2,
          maxLength: 40,
          description: 'Имя пользователя',
          example: 'Alice',
        },
        password: {
          type: 'string',
          minLength: 8,
          maxLength: 40,
          description: 'Пароль',
          example: 'Secret123!',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Пользователь авторизован' })
  @ApiResponse({ status: 400, description: 'Некорректные данные авторизации' })
  @Post('signin')
  signIn(@Body() body: { username: string; password: string }) {
    this.logger.verbose('Sign in request received');
    return this.authProxyService.signIn(body);
  }
}
