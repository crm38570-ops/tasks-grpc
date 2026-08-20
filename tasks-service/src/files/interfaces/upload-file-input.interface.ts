export interface UploadFileInputInterface {
  content: Uint8Array;
  metadata: {
    fileName: string;
    mimeType: string;
    size: number;
    taskId: string;
  };
}
