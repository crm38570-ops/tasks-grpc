"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDataSourceOptions = createDataSourceOptions;
function createDataSourceOptions(options) {
    return {
        type: 'postgres',
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
