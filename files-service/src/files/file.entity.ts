import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Index('IDX_task_id_user_id', ['taskId', 'userId'])
@Entity('file')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  fileId: string;

  @Column()
  fileName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  taskId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  uploadedAt: Date;
}
