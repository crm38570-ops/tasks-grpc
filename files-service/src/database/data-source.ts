import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { createDataSource } from '@mcs/shared';
import { DataSource } from 'typeorm';
import { FileEntity } from '../files/file.entity';

dotenv.config({ path: `.env.stage.${process.env.STAGE || 'dev'}` });

const dataSource: DataSource = createDataSource({
  database: 'files-service',
  migrationsTableName: 'files_migrations',
  migrationsGlob: `${__dirname}/migrations/*{.ts,.js}`,
  entities: [FileEntity],
  logging: true,
});

export default dataSource;
