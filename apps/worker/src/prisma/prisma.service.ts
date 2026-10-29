import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { prisma, createPrismaClient, type PrismaClient } from '@lernivox/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  readonly client: PrismaClient = prisma ?? createPrismaClient();

  async onModuleInit(): Promise<void> {
    try {
      await this.client.$connect();
      this.logger.log('Prisma connected to PostgreSQL successfully');
    } catch (err) {
      this.logger.error('Failed to connect to PostgreSQL via Prisma', err);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }

  get document(): PrismaClient['document'] {
    return this.client.document;
  }

  get documentSection(): PrismaClient['documentSection'] {
    return this.client.documentSection;
  }

  get documentChunk(): PrismaClient['documentChunk'] {
    return this.client.documentChunk;
  }

  get chunkEmbedding(): PrismaClient['chunkEmbedding'] {
    return this.client.chunkEmbedding;
  }

  get $executeRaw(): PrismaClient['$executeRaw'] {
    return this.client.$executeRaw.bind(this.client);
  }

  get $queryRaw(): PrismaClient['$queryRaw'] {
    return this.client.$queryRaw.bind(this.client);
  }
}
