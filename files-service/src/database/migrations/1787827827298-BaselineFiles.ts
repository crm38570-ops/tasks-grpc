import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineFiles1787827827298 implements MigrationInterface {
  name = 'BaselineFiles1787827827298';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "file" ("fileId" uuid NOT NULL DEFAULT uuid_generate_v4(), "fileName" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" integer NOT NULL, "taskId" character varying NOT NULL, "userId" character varying NOT NULL, "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f620cbf511fcf9b5970d187fdca" PRIMARY KEY ("fileId"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "file"`);
  }
}
