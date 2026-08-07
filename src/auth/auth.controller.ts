import { Body, Controller, Logger, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto';
import { JwtAccessToken } from './types/jwt-access-token.interface';
import { User } from './user.entity';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenDto } from './dto/jwt-access-token.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private logger = new Logger(`AuthController`);

  constructor(private authServise: AuthService) {}

  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiBody({
    type: AuthCredentialsDto,
    examples: {
      Валидный: {
        value: { username: 'Marsianin', password: 'M@k@rony404!' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Пользователь создан',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description:
      'Некорректные данные: username или password не прошли валидацию',
  })
  @ApiResponse({
    status: 409,
    description: 'Username уже занят',
  })
  @Post('signup')
  async signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<User> {
    this.logger.verbose(`User "${authCredentialsDto.username}" signing up`);
    return this.authServise.signUp(authCredentialsDto);
  }

  @ApiOperation({ summary: 'Аутентификация пользователя' })
  @ApiBody({
    type: AuthCredentialsDto,
    examples: {
      Валидный: {
        value: { username: 'Marsianin', password: 'M@k@rony404!' },
      },
      'Неверный пароль': {
        value: { username: 'Marsianin', password: 'wrong-pass' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Успешная идентификация, токен выдан',
    type: JwtAccessTokenDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Неверный логин или пароль',
  })
  @Post('signin')
  async signIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<JwtAccessToken> {
    this.logger.verbose(`User "${authCredentialsDto.username}" signing in`);
    return this.authServise.signIn(authCredentialsDto);
  }
}
