import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@lernivox/contracts';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.DOCUMENT_INGESTION,
    }),
    WorkspacesModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
