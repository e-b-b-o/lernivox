import { PrismaClient, WorkspaceType, WorkspaceRole } from '@prisma/client';

/**
 * Idempotent backfill script:
 * Ensures every Document has exactly one persistent Workspace (PERSONAL by default),
 * links the owner as initial WorkspaceMember with role OWNER,
 * and updates any existing conversations to associate with that workspace.
 */
export async function backfillWorkspaces(prisma: PrismaClient): Promise<{
  backfilledCount: number;
  totalDocuments: number;
  totalWorkspaces: number;
}> {
  const documentsWithoutWorkspace = await prisma.document.findMany({
    where: {
      workspaceId: null,
      ownerId: { not: null },
    },
    select: {
      id: true,
      title: true,
      ownerId: true,
      createdAt: true,
    },
  });

  let backfilledCount = 0;

  for (const doc of documentsWithoutWorkspace) {
    const ownerId = doc.ownerId;
    if (!ownerId) continue;

    await prisma.$transaction(async (tx) => {
      // 1. Create PERSONAL workspace
      const workspace = await tx.workspace.create({
        data: {
          name: doc.title,
          type: WorkspaceType.PERSONAL,
          ownerId,
          createdAt: doc.createdAt,
        },
      });

      // 2. Add owner as workspace member
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: ownerId,
          role: WorkspaceRole.OWNER,
          joinedAt: doc.createdAt,
        },
      });

      // 3. Link document to workspace
      await tx.document.update({
        where: { id: doc.id },
        data: { workspaceId: workspace.id },
      });

      // 4. Update conversations associated with this document
      await tx.conversation.updateMany({
        where: {
          documentId: doc.id,
          workspaceId: null,
        },
        data: { workspaceId: workspace.id },
      });
    });

    backfilledCount++;
  }

  const [totalDocuments, totalWorkspaces] = await Promise.all([
    prisma.document.count(),
    prisma.workspace.count(),
  ]);

  return {
    backfilledCount,
    totalDocuments,
    totalWorkspaces,
  };
}
