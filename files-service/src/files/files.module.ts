import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesRepository } from './files.repository';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileEntity } from './file.entity';
import { FilesService } from './files.service';
import { TasksInternalModule } from './tasks-internal/tasks-internal.module';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity]), ConfigModule, TasksInternalModule],
  providers: [FilesRepository, FilesService],
  controllers: [FilesController],
})
export class FilesModule {}
