import { TaskStatus } from '../enums/task-status.enum';

export class TaskResponseDto {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
}
