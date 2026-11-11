import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import {
  LocalStorageAdapter,
  CloudinaryStorageAdapter,
  type StorageService,
} from '@lernivox/storage';

export const STORAGE_SERVICE_TOKEN = 'STORAGE_SERVICE';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_SERVICE_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService): StorageService => {
        const driver = config.get<string>('STORAGE_DRIVER', 'local');

        if (driver === 'cloudinary') {
          const cloudinaryUrl = config.get<string>('CLOUDINARY_URL', process.env.CLOUDINARY_URL || '');
          if (!cloudinaryUrl) {
            throw new Error(
              'STORAGE_DRIVER is set to "cloudinary", but CLOUDINARY_URL is missing. Please configure CLOUDINARY_URL in the format: cloudinary://<api_key>:<api_secret>@<cloud_name>',
            );
          }
          return new CloudinaryStorageAdapter({
            cloudinaryUrl,
            secure: true,
          });
        }

        // Default to LocalStorageAdapter with absolute shared uploads directory
        const configuredDir = config.get<string>('STORAGE_BASE_DIR');
        let uploadDir: string;

        if (configuredDir) {
          uploadDir = path.resolve(configuredDir);
        } else {
          // Find repo root if running inside apps/api
          const cwd = process.cwd();
          if (fs.existsSync(path.resolve(cwd, '../../uploads')) || fs.existsSync(path.resolve(cwd, '../../package.json'))) {
            uploadDir = path.resolve(cwd, '../../uploads');
          } else {
            uploadDir = path.resolve(cwd, 'uploads');
          }
        }

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        return new LocalStorageAdapter(uploadDir);
      },
    },
  ],
  exports: [STORAGE_SERVICE_TOKEN],
})
export class StorageModule {}
