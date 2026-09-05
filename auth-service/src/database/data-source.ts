import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from '@mcs/shared';
import { User } from '../user/user.entity';

dotenv.config({ path: `.env.stage.${process.env.STAGE || 'dev'}` });

export default new DataSource(
  createDataSourceOptions({
    database: 'auth-service',
    migrationsTableName: 'auth_migrations',
    migrationsGlob: `${__dirname}/migrations/*{.ts,.js}`,
    entities: [User],
  }),
);
