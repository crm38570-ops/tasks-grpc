import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineTasks1787820690226 implements MigrationInterface {
  name = 'BaselineTasks1787820690226';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "task" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying NOT NULL, "status" character varying NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_f316d3fe53497d4d8a2957db8b" ON "task"  ("userId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_f316d3fe53497d4d8a2957db8b"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "task"`);
  }
}
