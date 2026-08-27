import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTaskUserForeignKey1788000000000 implements MigrationInterface {
  name = 'RemoveTaskUserForeignKey1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE constraint_name text;
      BEGIN
        SELECT tc.constraint_name INTO constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'task'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'userId'
        LIMIT 1;

        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "task" DROP CONSTRAINT %I', constraint_name);
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_f316d3fe53497d4d8a2957db8b" ON "task" ("userId")`,
    );
  }

  public async down(): Promise<void> {}
}
