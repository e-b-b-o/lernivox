import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { StorageFileMeta, StorageService, UploadOptions } from '../storage.interface';

export class LocalStorageAdapter implements StorageService {
  constructor(private readonly baseDir: string = './uploads') {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolvePath(filePath: string): string {
    return path.resolve(this.baseDir, filePath);
  }

  async upload(
    data: Buffer | Uint8Array | Readable,
    options: UploadOptions,
  ): Promise<StorageFileMeta> {
    const fullPath = this.resolvePath(options.path);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let sizeBytes = 0;
    if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
      await fs.promises.writeFile(fullPath, data);
      sizeBytes = data.byteLength;
    } else {
      const writeStream = fs.createWriteStream(fullPath);
      await new Promise<void>((resolve, reject) => {
        data.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      const stat = await fs.promises.stat(fullPath);
      sizeBytes = stat.size;
    }

    return {
      path: options.path,
      originalName: path.basename(options.path),
      mimeType: options.contentType ?? 'application/octet-stream',
      sizeBytes,
      uploadedAt: new Date(),
      isPrivate: options.isPrivate ?? true,
    };
  }

  async download(
    filePath: string,
    range?: { start: number; end: number },
  ): Promise<Readable> {
    const fullPath = this.resolvePath(filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.createReadStream(
      fullPath,
      range ? { start: range.start, end: range.end } : undefined,
    );
  }

  async getSignedUrl(filePath: string, _expiresInSeconds = 3600): Promise<string> {
    // Local development signed URL mock representation
    return `/storage/file/${encodeURIComponent(filePath)}`;
  }

  async delete(filePath: string): Promise<boolean> {
    const fullPath = this.resolvePath(filePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = this.resolvePath(filePath);
    return fs.existsSync(fullPath);
  }
}
