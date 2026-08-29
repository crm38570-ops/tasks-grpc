import { Client } from 'pg';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateLegacyUsers1740000001000 implements MigrationInterface {
  name = 'MigrateLegacyUsers1740000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const legacyDatabase = process.env.LEGACY_DB_DATABASE;

    if (!legacyDatabase) return;

    const client = new Client({
      host: process.env.LEGACY_DB_HOST ?? process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.LEGACY_DB_PORT ?? process.env.DB_PORT ?? 5432),
      user: process.env.LEGACY_DB_USERNAME ?? process.env.DB_USERNAME,
      password: process.env.LEGACY_DB_PASSWORD ?? process.env.DB_PASSWORD,
      database: legacyDatabase,
    });

    await client.connect();

    try {
      const table = await client.query<{ exists: boolean }>(
        `SELECT to_regclass('public.user') IS NOT NULL AS exists`,
      );

      if (!table.rows[0]?.exists) return;

      const users = await client.query<{
        id: string;
        username: string;
        password: string;
      }>('SELECT "id", "username", "password" FROM "user"');

      for (const user of users.rows) {
        await queryRunner.query(
          `INSERT INTO "user" ("id", "username", "password")
           VALUES ($1, $2, $3)
           ON CONFLICT ("id") DO NOTHING`,
          [user.id, user.username, user.password],
        );
      }
    } finally {
      await client.end();
    }
  }

  public async down(): Promise<void> {}
}
