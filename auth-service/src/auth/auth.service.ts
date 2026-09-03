import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { UsersRepository } from '../user/users.repository';
import { AuthCredentialsDto, UserResponseDto } from './dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types';
import { JwtAccessToken } from './types/jwt-access-token.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService', { timestamp: true });
  private readonly dummyBcryptHash: string;

  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.dummyBcryptHash =
      configService.getOrThrow<string>('DUMMY_BCRYPT_HASH');
  }

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

    const isPasswordValid = await bcrypt.compare(
      password,
      user?.password ?? this.dummyBcryptHash,
    );

    if (!(user && isPasswordValid)) {
      this.logger.warn(`Failed sign-in attempt for user "${username}"`);
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Please check your login credentials',
      });
    }

    const payload: JwtPayload = { username, userId: user.id };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
