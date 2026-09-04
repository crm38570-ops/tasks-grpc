"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDataSource = createDataSource;
const typeorm_1 = require("typeorm");
function createDataSource(options) {
    return new typeorm_1.DataSource({
        type: "postgres",
        host: process.env.DB_HOST ?? "localhost",
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USERNAME ?? "postgres",
        password: process.env.DB_PASSWORD ?? "postgres",
        database: options.database,
        entities: options.entities,
        migrations: [options.migrationsGlob],
        migrationsTableName: options.migrationsTableName,
        synchronize: false,
        logging: options.logging ?? false,
    });
}
