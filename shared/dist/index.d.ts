export interface McsDataSourceOptions {
    database: string;
    migrationsTableName: string;
    migrationsGlob: string;
    entities: any[];
    logging?: boolean;
}
export declare function createDataSourceOptions(options: McsDataSourceOptions): {
    type: "postgres";
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    entities: any[];
    migrations: string[];
    migrationsTableName: string;
    synchronize: boolean;
    logging: boolean;
};
export interface McsGrpcServerOptions {
    package: string | string[];
    protoPath: string | string[];
    port: number;
}
export declare function createGrpcServerOptions(options: McsGrpcServerOptions): {
    package: string | string[];
    protoPath: string | string[];
    url: string;
    loader: {
        longs: NumberConstructor;
    };
};
