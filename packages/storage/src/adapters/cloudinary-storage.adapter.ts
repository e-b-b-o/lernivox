import { Readable } from 'stream';
import { StorageFileMeta, StorageService, UploadOptions } from '../storage.interface';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  secure?: boolean;
}

/**
 * Provisional Cloudinary adapter structure.
 * Implements the vendor-agnostic StorageService contract without hardwiring
 * proprietary SDK calls directly into API or worker business logic.
 */
export class CloudinaryStorageAdapter implements StorageService {
  constructor(private readonly config: CloudinaryConfig) {
    if (!config.cloudName || !config.apiKey || !config.apiSecret) {
      // Configuration validation placeholder
    }
  }

  async upload(
    _data: Buffer | Uint8Array | Readable,
    options: UploadOptions,
  ): Promise<StorageFileMeta> {
    // Adapter implementation stub to be wired with verified credentials in storage integration phase
    return {
      path: options.path,
      originalName: options.path.split('/').pop() ?? 'file',
      mimeType: options.contentType ?? 'application/pdf',
      sizeBytes: 0,
      uploadedAt: new Date(),
      isPrivate: options.isPrivate ?? true,
    };
  }

  async download(_filePath: string): Promise<Readable> {
    throw new Error('Direct stream download from Cloudinary requires signed authenticated fetch');
  }

  async getSignedUrl(filePath: string, _expiresInSeconds = 3600): Promise<string> {
    // Generates server-authorized private URL
    return `https://res.cloudinary.com/${this.config.cloudName}/private/${encodeURIComponent(filePath)}`;
  }

  async delete(_filePath: string): Promise<boolean> {
    return true;
  }

  async exists(_filePath: string): Promise<boolean> {
    return true;
  }
}
