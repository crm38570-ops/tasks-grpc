import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { DataSource } from 'typeorm';
import { AuthCredentialsDto } from '../auth/dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersRepository extends Repository<User> {
  private readonly logger = new Logger('UsersRepository', { timestamp: true });

  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async createUser(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    const { username, password } = authCredentialsDto;

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);

    const user = this.create({ username, password: hash });

    try {
      await this.save(user);
      this.logger.log(`User "${username}" created`);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to create user "${username}"`,
        error instanceof Error ? error.stack : String(error),
      );

      if (error instanceof QueryFailedError) {
        const code = (error.driverError as { code?: string }).code;

        if (code === '23505') {
          throw new RpcException({
            code: status.ALREADY_EXISTS,
            message: 'Username already exists',
          });
        } else {
          throw new RpcException({
            code: status.INTERNAL,
            message: 'Internal server error',
          });
        }
      } else {
        throw error;
      }
    }

    return user;
  }
}
