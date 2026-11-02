import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GeminiProvider, MockAiProvider } from '@lernivox/ai-core';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RetrievalService } from './retrieval.service';
import { AI_PROVIDER_TOKEN } from './tutor.constants';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { TutorController } from './tutor.controller';
import { TutorService } from './tutor.service';

@Module({
  imports: [PrismaModule, ConfigModule, WorkspacesModule],
  controllers: [TutorController],
  providers: [
    RetrievalService,
    TutorService,
    {
      provide: AI_PROVIDER_TOKEN,
      useFactory: (config: ConfigService) => {
        const providerName = config.get<string>('AI_PROVIDER', 'google-gemini');
        const apiKey = config.get<string>('GEMINI_API_KEY', '');
        const isMock =
          providerName === 'mock' ||
          process.env.NODE_ENV === 'test' ||
          config.get<string>('USE_MOCK_EMBEDDINGS') === 'true';

        if (isMock) {
          return new MockAiProvider(768);
        }

        if (!apiKey || apiKey.includes('placeholder') || apiKey.trim().length < 10) {
          return new MockAiProvider(768);
        }

        const embeddingModel = config.get<string>(
          'GEMINI_EMBEDDING_MODEL',
          'gemini-embedding-2',
        );
        const defaultModel = config.get<string>('GEMINI_MODEL', 'gemini-3.5-flash');

        return new GeminiProvider({ apiKey, embeddingModel, defaultModel });
      },
      inject: [ConfigService],
    },
  ],
  exports: [TutorService, RetrievalService],
})
export class TutorModule {}
