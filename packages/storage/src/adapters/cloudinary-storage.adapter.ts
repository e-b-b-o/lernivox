import { Readable } from 'stream';
import * as path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { StorageFileMeta, StorageService, UploadOptions } from '../storage.interface';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  secure?: boolean;
}

/**
 * Production Cloudinary storage adapter.
 * Implements the vendor-agnostic StorageService contract using the official
 * Cloudinary Node SDK with authenticated, signed downloads and uploads.
 */
export class CloudinaryStorageAdapter implements StorageService {
  constructor(private readonly config: CloudinaryConfig) {
    if (config.cloudName && config.apiKey && config.apiSecret) {
      cloudinary.config({
        cloud_name: config.cloudName,
        api_key: config.apiKey,
        api_secret: config.apiSecret,
        secure: config.secure !== false,
      });
    }
  }

  private resolveResourceType(ext: string): 'raw' | 'image' {
    const cleanExt = ext.replace(/^\./, '').toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(cleanExt)) {
      return 'image';
    }
    // PDF, DOCX, TXT and all reading documents are treated as 'raw' assets
    return 'raw';
  }

  async upload(
    data: Buffer | Uint8Array | Readable,
    options: UploadOptions,
  ): Promise<StorageFileMeta> {
    const ext = path.extname(options.path).replace(/^\./, '').toLowerCase();
    const resourceType = this.resolveResourceType(ext);
    const deliveryType = options.isPrivate !== false ? 'authenticated' : 'upload';

    const uploadOptions = {
      public_id: options.path,
      resource_type: resourceType,
      type: deliveryType,
      overwrite: true,
      unique_filename: false,
      use_filename: false,
    };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            return reject(new Error(`Cloudinary upload failed: ${error.message}`));
          }
          if (!result) {
            return reject(new Error('Cloudinary upload returned empty result'));
          }

          resolve({
            path: options.path,
            originalName: options.path.split('/').pop() ?? 'file',
            mimeType: options.contentType ?? (resourceType === 'image' ? `image/${ext}` : 'application/pdf'),
            sizeBytes: result.bytes ?? 0,
            uploadedAt: new Date(result.created_at ?? Date.now()),
            isPrivate: options.isPrivate !== false,
          });
        },
      );

      uploadStream.on('error', (err) => {
        reject(new Error(`Cloudinary upload stream error: ${err.message}`));
      });

      if (Buffer.isBuffer(data)) {
        uploadStream.end(data);
      } else if (data instanceof Uint8Array) {
        uploadStream.end(Buffer.from(data));
      } else if (typeof (data as Readable).pipe === 'function') {
        (data as Readable).pipe(uploadStream);
      } else {
        reject(new Error('Unsupported data type for Cloudinary upload'));
      }
    });
  }

  /**
   * Generates a server-authorized, signed temporary URL for direct authenticated downloads.
   * Default lifetime is 3600 seconds (1 hour). For worker ingestion, shorter lifetimes (300s) are used.
   */
  async getSignedUrl(
    filePath: string,
    expiresInSeconds = 3600,
    options?: {
      resourceType?: 'raw' | 'image';
      deliveryType?: 'authenticated' | 'private' | 'upload';
    },
  ): Promise<string> {
    const ext = path.extname(filePath).replace(/^\./, '').toLowerCase();
    const resourceType = options?.resourceType ?? this.resolveResourceType(ext);
    const deliveryType = options?.deliveryType ?? 'authenticated';
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    const publicIdWithoutExt = ext && filePath.toLowerCase().endsWith(`.${ext}`)
      ? filePath.slice(0, -(ext.length + 1))
      : filePath;

    // Use official Cloudinary private_download_url
    const signedUrl = cloudinary.utils.private_download_url(
      publicIdWithoutExt,
      ext,
      {
        resource_type: resourceType,
        type: deliveryType,
        expires_at: expiresAt,
      },
    );

    return signedUrl;
  }

  /**
   * Downloads a protected file from Cloudinary as a Node Readable stream.
   * Leverages signed authenticated URLs and supports HTTP Range headers.
   */
  async download(
    filePath: string,
    range?: { start: number; end: number },
  ): Promise<Readable> {
    const ext = path.extname(filePath).replace(/^\./, '').toLowerCase();
    const resourceType = this.resolveResourceType(ext);

    // Candidates to try:
    // 1. Standard: raw + authenticated + public_id without extension + format
    // 2. Fallback A: raw + authenticated + full public_id (with extension) + format empty
    // 3. Fallback B: raw + upload + sign_url (in case asset was stored with type upload)
    // 4. Fallback C: image + authenticated (for PDFs uploaded as image resource type)
    const attempts = [
      { resourceType, deliveryType: 'authenticated' as const, stripExt: true },
      { resourceType, deliveryType: 'authenticated' as const, stripExt: false },
      { resourceType, deliveryType: 'upload' as const, stripExt: true },
      ...(resourceType === 'raw' && ext === 'pdf'
        ? [{ resourceType: 'image' as const, deliveryType: 'authenticated' as const, stripExt: true }]
        : []),
    ];

    let lastError: Error | null = null;

    for (const attempt of attempts) {
      try {
        const expiresAt = Math.floor(Date.now() / 1000) + 300; // 5-minute budget for worker download
        const targetPublicId = attempt.stripExt && ext && filePath.endsWith(`.${ext}`)
          ? filePath.slice(0, -(ext.length + 1))
          : filePath;
        const targetFormat = attempt.stripExt ? ext : '';

        const signedUrl = cloudinary.utils.private_download_url(
          targetPublicId,
          targetFormat,
          {
            resource_type: attempt.resourceType,
            type: attempt.deliveryType,
            expires_at: expiresAt,
          },
        );

        const headers: Record<string, string> = {
          'User-Agent': 'Lernivox-Storage/1.0',
          Accept: '*/*',
        };

        if (range && (range.start !== undefined || range.end !== undefined)) {
          const endStr = range.end !== undefined ? range.end.toString() : '';
          headers['Range'] = `bytes=${range.start}-${endStr}`;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

        const response = await fetch(signedUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (response.ok) {
          if (!response.body) {
            throw new Error('Response body is empty');
          }
          // Convert Web ReadableStream to Node Readable
          const nodeStream = Readable.fromWeb(response.body as unknown as import('stream/web').ReadableStream);
          return nodeStream;
        }

        // If 401 or 404, try next fallback candidate
        if (response.status === 401 || response.status === 404) {
          lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
          continue;
        }

        throw new Error(`Cloudinary download returned HTTP ${response.status} ${response.statusText}`);
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw new Error(
      `Direct stream download from Cloudinary failed for "${filePath}": ${lastError?.message || 'File not accessible'}`,
    );
  }

  async delete(filePath: string): Promise<boolean> {
    const ext = path.extname(filePath).replace(/^\./, '').toLowerCase();
    const resourceType = this.resolveResourceType(ext);
    const publicIdWithoutExt = ext && filePath.endsWith(`.${ext}`)
      ? filePath.slice(0, -(ext.length + 1))
      : filePath;

    try {
      await cloudinary.uploader.destroy(publicIdWithoutExt, {
        resource_type: resourceType,
        type: 'authenticated',
      });
      return true;
    } catch {
      try {
        await cloudinary.uploader.destroy(filePath, {
          resource_type: resourceType,
          type: 'authenticated',
        });
        return true;
      } catch {
        return false;
      }
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const ext = path.extname(filePath).replace(/^\./, '').toLowerCase();
    const resourceType = this.resolveResourceType(ext);
    const publicIdWithoutExt = ext && filePath.endsWith(`.${ext}`)
      ? filePath.slice(0, -(ext.length + 1))
      : filePath;

    try {
      await cloudinary.api.resource(publicIdWithoutExt, {
        resource_type: resourceType,
        type: 'authenticated',
      });
      return true;
    } catch {
      try {
        await cloudinary.api.resource(filePath, {
          resource_type: resourceType,
          type: 'authenticated',
        });
        return true;
      } catch {
        return false;
      }
    }
  }
}
