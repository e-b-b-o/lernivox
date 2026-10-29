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
          const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME', '');
          const apiKey = config.get<string>('CLOUDINARY_API_KEY', '');
          const apiSecret = config.get<string>('CLOUDINARY_API_SECRET', '');

          if (cloudName && apiKey && apiSecret && !cloudName.includes('placeholder')) {
            return new CloudinaryStorageAdapter({
              cloudName,
              apiKey,
              apiSecret,
            });
          }
        }

        const configuredDir = config.get<string>('STORAGE_BASE_DIR');
        let uploadDir: string;

        if (configuredDir) {
          uploadDir = path.resolve(configuredDir);
        } else {
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
