import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesService } from './files.service';
import { FilesRepository } from './files.repository';
import { Module } from '@nestjs/common';
import { FileEntity } from './file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity])],
  providers: [FilesRepository],
  controllers: [FilesService],
})
export class FilesModule {}
