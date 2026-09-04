export interface McsDataSourceOptions {
  database: string;
  migrationsTableName: string;
  migrationsGlob: string;
  entities: any[];
  logging?: boolean;
}

export function createDataSourceOptions(options: McsDataSourceOptions) {
  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_DATABASE ?? options.database,
    entities: options.entities,
    migrations: [options.migrationsGlob],
    migrationsTableName: options.migrationsTableName,
    synchronize: false,
    logging: options.logging ?? false,
  };
}

export interface McsGrpcServerOptions {
  package: string | string[];
  protoPath: string | string[];
  port: number;
}

export function createGrpcServerOptions(options: McsGrpcServerOptions) {
  return {
    package: options.package,
    protoPath: options.protoPath,
    url: `0.0.0.0:${options.port}`,
    loader: {
      longs: Number,
    },
  };
}
