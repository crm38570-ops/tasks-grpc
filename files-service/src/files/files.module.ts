import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesRepository } from './files.repository';
import { Module } from '@nestjs/common';
import { FileEntity } from './file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity])],
  providers: [FilesRepository],
  controllers: [FilesController],
})
export class FilesModule {}
