import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { WorkspacesController } from './workspaces.controller';
import { InvitationsController } from './invitations.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorkspacesController, InvitationsController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
