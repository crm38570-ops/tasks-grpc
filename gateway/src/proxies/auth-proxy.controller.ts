import { Body, Controller, Post } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';

@Controller('auth')
export class AuthProxyController {
  constructor(private readonly http: HttpService) {}

  @Post('signup')
  signUp(@Body() body: unknown) {
    return this.http
      .post(`${AUTH_SERVICE_URL}/auth/signup`, body)
      .pipe(map((response) => response.data));
  }

  @Post('signin')
  signIn(@Body() body: unknown) {
    return this.http
      .post(`${AUTH_SERVICE_URL}/auth/signin`, body)
      .pipe(map((response) => response.data));
  }
}
