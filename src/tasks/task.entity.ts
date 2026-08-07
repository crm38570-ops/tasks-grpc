import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { TaskStatus } from './task-status.enum';
import { User } from '../auth/user.entity';
import { Exclude } from 'class-transformer';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

@Entity()
export class Task {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'UUID задачи',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Написать диссертацию',
    description: 'Заголовок задачи',
  })
  @Column()
  title: string;

  @ApiProperty({
    example: '"Капибары, почему все мы их так любим?"',
    description: 'Подробное описание задачи',
  })
  @Column()
  description: string;

  @ApiProperty({
    enum: TaskStatus,
    enumName: 'TaskStatus',
    example: TaskStatus.OPEN,
    description: 'Текущий статус задачи',
  })
  @Column()
  status: TaskStatus;

  @ApiHideProperty()
  @ManyToOne(() => User, (user) => user.tasks, { eager: false })
  @Exclude({ toPlainOnly: true })
  user: User;
}
