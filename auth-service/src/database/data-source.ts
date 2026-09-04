import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { createDataSource } from '@mcs/shared';
import { DataSource } from 'typeorm';
import { User } from '../user/user.entity';

dotenv.config({ path: `.env.stage.${process.env.STAGE || 'dev'}` });

const dataSource: DataSource = createDataSource({
  database: 'auth-service',
  migrationsTableName: 'auth_migrations',
  migrationsGlob: `${__dirname}/migrations/*{.ts,.js}`,
  entities: [User],
});

export default dataSource;
