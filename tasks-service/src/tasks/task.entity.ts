import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { TaskStatus } from './enums/task-status.enum';

@Index('IDX_task_user_id_status', ['userId', 'status'])
@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  status: TaskStatus;

  @Column({ type: 'uuid' })
  userId: string;
}
