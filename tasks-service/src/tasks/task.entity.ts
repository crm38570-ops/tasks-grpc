import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { TaskStatus } from './enums/task-status.enum';

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

  @Index()
  @Column({ type: 'uuid' })
  userId: string;
}
