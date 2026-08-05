import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { DataSource } from 'typeorm/browser';
import { AuthCredentialsDto } from './dto';

@Injectable()
export class UsersRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async createUser(createUserDto: AuthCredentialsDto): Promise<void> {
    const { username, password } = createUserDto;

    const user = this.create({ username, password });

    await this.save(user);
  }
}
