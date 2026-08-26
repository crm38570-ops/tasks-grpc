import type { Readable } from 'node:stream';

export interface UploadFileInputInterface {
  content: Readable;
  metadata: {
    fileName: string;
    mimeType: string;
    size: number;
    taskId: string;
  };
}
