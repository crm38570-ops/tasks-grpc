import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskUserStatusIndex1788525097545 implements MigrationInterface {
  name = 'AddTaskUserStatusIndex1788525097545';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f316d3fe53497d4d8a2957db8b"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_task_user_id_status" ON "task"  ("userId", "status") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_task_user_id_status"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_f316d3fe53497d4d8a2957db8b" ON "task" USING btree ("userId") `,
    );
  }
}
