import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from '../user/users.repository';
import { AuthCredentialsDto, UserResponseDto } from './dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types';
import { JwtAccessToken } from './types/jwt-access-token.interface';

@Injectable()
export class AuthService {
  private logger = new Logger(`AuthService`);

  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
  ) {}

  async signUp(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`Signing up user "${authCredentialsDto.username}"`);
    const user = await this.usersRepository.createUser(authCredentialsDto);
    const { username, id } = user;

    return { username, id };
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<JwtAccessToken> {
    const { username, password } = authCredentialsDto;

    this.logger.log(`Signing in user "${username}"`);
    const user = await this.usersRepository.findOne({ where: { username } });

    if (!(user && (await bcrypt.compare(password, user.password)))) {
      this.logger.warn(`Failed sign-in attempt for user "${username}"`);
      throw new UnauthorizedException('Please check your login credentials');
    }

    const payload: JwtPayload = { username, userId: user.id };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
