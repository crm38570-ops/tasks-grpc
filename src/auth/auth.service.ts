import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { AuthCredentialsDto } from './dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types';
import { JwtAccessToken } from './types/jwt-access-token.interface';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  private logger = new Logger(`AuthService`);

  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
  ) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    this.logger.log(`Signing up user "${authCredentialsDto.username}"`);
    return this.usersRepository.createUser(authCredentialsDto);
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

    const payload: JwtPayload = { username };
    const acessToken = this.jwtService.sign(payload);

    return { acessToken };
  }
}
