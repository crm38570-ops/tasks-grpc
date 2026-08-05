import { IsUUID } from 'class-validator';

export class DeleteTaskDto {
  @IsUUID('4')
  id: string;
}
