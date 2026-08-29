import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Task } from '../tasks/task.entity';

dotenv.config({ path: `.env.stage.${process.env.STAGE || 'dev'}` });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'tasks-service',
  entities: [Task],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  migrationsTableName: 'tasks_migrations',
});
