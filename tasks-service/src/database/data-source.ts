import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { createDataSource } from '@mcs/shared';
import { Task } from '../tasks/task.entity';

dotenv.config({ path: `.env.stage.${process.env.STAGE || 'dev'}` });

export default createDataSource({
  database: 'tasks-service',
  migrationsTableName: 'tasks_migrations',
  migrationsGlob: `${__dirname}/migrations/*{.ts,.js}`,
  entities: [Task],
});
