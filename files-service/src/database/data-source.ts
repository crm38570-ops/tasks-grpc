import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { createDataSource } from '@mcs/shared';
import { FileEntity } from '../files/file.entity';

dotenv.config({ path: `.env.stage.${process.env.STAGE || 'dev'}` });

export default createDataSource({
  database: 'files-service',
  migrationsTableName: 'files_migrations',
  migrationsGlob: `${__dirname}/migrations/*{.ts,.js}`,
  entities: [FileEntity],
  logging: true,
});
