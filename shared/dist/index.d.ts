import { DataSource } from "typeorm";
export interface McsDataSourceOptions {
    database: string;
    migrationsTableName: string;
    migrationsGlob: string;
    entities: any[];
    logging?: boolean;
}
export declare function createDataSource(options: McsDataSourceOptions): DataSource;
