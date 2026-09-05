import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskIdUserIdIndex1788526387140 implements MigrationInterface {
  name = 'AddTaskIdUserIdIndex1788526387140';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_task_id_user_id" ON "file"  ("taskId", "userId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_task_id_user_id"`);
  }
}
