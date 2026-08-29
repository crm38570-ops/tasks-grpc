import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialTasks1787753180749 implements MigrationInterface {
  name = 'InitialTasks1787753180749';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f316d3fe53497d4d8a2957db8b" ON "task"  ("userId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f316d3fe53497d4d8a2957db8b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "userId" DROP NOT NULL`,
    );
  }
}
