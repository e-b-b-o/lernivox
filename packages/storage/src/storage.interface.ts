import { Readable } from 'stream';

export interface StorageFileMeta {
  path: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
  isPrivate: boolean;
}

export interface UploadOptions {
  path: string;
  isPrivate?: boolean;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StorageService {
  upload(
    data: Buffer | Uint8Array | Readable,
    options: UploadOptions,
  ): Promise<StorageFileMeta>;

  download(path: string, range?: { start: number; end: number }): Promise<Readable>;

  getSignedUrl(path: string, expiresInSeconds?: number): Promise<string>;

  delete(path: string): Promise<boolean>;

  exists(path: string): Promise<boolean>;
}
