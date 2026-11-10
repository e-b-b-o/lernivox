import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { LearningPlansController } from './learning-plans.controller';
import { LearningPlansService } from './learning-plans.service';

@Module({
  imports: [PrismaModule, WorkspacesModule],
  controllers: [LearningPlansController],
  providers: [LearningPlansService],
  exports: [LearningPlansService],
})
export class LearningPlansModule {}

