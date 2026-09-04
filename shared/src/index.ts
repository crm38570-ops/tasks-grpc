import { DataSource } from "typeorm";

export interface McsDataSourceOptions {
  database: string;
  migrationsTableName: string;
  migrationsGlob: string;
  entities: any[];
  logging?: boolean;
}

export function createDataSource(options: McsDataSourceOptions): DataSource {
  return new DataSource({
    type: "postgres",
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    database: process.env.DB_DATABASE ?? options.database,
    entities: options.entities,
    migrations: [options.migrationsGlob],
    migrationsTableName: options.migrationsTableName,
    synchronize: false,
    logging: options.logging ?? false,
  });
}
