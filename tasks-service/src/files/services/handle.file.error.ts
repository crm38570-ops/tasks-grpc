import { NotFoundException } from '@nestjs/common';

export const handleFileError = (error: unknown): never => {
  const grpcError = error as { code?: number };

  if (grpcError.code === 5) {
    throw new NotFoundException('Файл не найден');
  }

  throw error;
};
