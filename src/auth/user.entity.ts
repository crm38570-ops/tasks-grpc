import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Task } from '../tasks/task.entity';
import { Exclude } from 'class-transformer';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

@Entity()
export class User {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'UUID пользователя',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Marsianin',
    description: 'Уникальное имя пользователя',
  })
  @Column({ unique: true })
  username: string;

  @ApiProperty({
    example: 'M@k@rony44!',
    description: 'Хэш пароля (только на запись)',
    writeOnly: true,
  })
  @Exclude({ toPlainOnly: true })
  @Column()
  password: string;

  @ApiHideProperty()
  @OneToMany(() => Task, (task) => task.user, { eager: true })
  tasks: Task[];
}
