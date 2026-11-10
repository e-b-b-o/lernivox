import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  generateLearningPlan,
  adaptLearningPlan,
  type GeneratedPlanActivity,
} from '@lernivox/ai-core';
import {
  LearningPlanDto,
  StudySessionDto,
  PlanActivityDto,
  PlanOfferDto,
  LearningPlanPreviewDto,
  CreatePlanPreviewDto,
  AcceptPlanDto,
  UpdateSessionDto,
  AdaptPlanDto,
  UpdatePlanLifecycleDto,
  PlanLifecycleStatus,
  SessionStatus,
  AdaptationHistoryEntryDto,
} from '@lernivox/contracts';
import { PrismaService } from '../common/prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class LearningPlansService {
  private readonly logger = new Logger(LearningPlansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  /**
   * Validates workspace membership or ownership and returns workspace with attached document.
   */
  private async getAuthorizedWorkspace(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        document: {
          include: {
            sections: {
              orderBy: { chapterNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or access denied.');
    }

    return workspace;
  }

  /**
   * Formats a Prisma StudyPlan record and its items into a canonical LearningPlanDto.
   */
  private formatLearningPlan(plan: any): LearningPlanDto {
    const rawSessions: any[] = plan.scheduleItems || [];
    const sessions: StudySessionDto[] = rawSessions.map((s) => {
      const activities: PlanActivityDto[] = Array.isArray(s.activities)
        ? s.activities
        : [];

      return {
        id: s.id,
        studyPlanId: s.studyPlanId,
        sessionNumber: s.sessionNumber,
        orderIndex: s.orderIndex,
        scheduledDate: s.scheduledDate.toISOString(),
        title: s.title,
        description: s.description || undefined,
        status: (s.status || (s.isCompleted ? 'COMPLETED' : 'NOT_STARTED')) as SessionStatus,
        estimatedMinutes: s.estimatedMinutes || 30,
        sourcePageStart: s.sourcePageStart ?? undefined,
        sourcePageEnd: s.sourcePageEnd ?? undefined,
        sourceChapter: s.sourceChapter || undefined,
        topicKey: s.topicKey || undefined,
        activities,
        completedAt: s.completedAt ? s.completedAt.toISOString() : undefined,
        createdAt: s.createdAt.toISOString(),
      };
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
    const percentComplete =
      totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    const remainingSessions = sessions.filter((s) => s.status !== 'COMPLETED');
    const estimatedMinutesRemaining = remainingSessions.reduce(
      (acc, s) => acc + s.estimatedMinutes,
      0,
    );

    const currentSession = sessions.find((s) => s.status !== 'COMPLETED');

    const rawHistory = Array.isArray(plan.adaptationHistory)
      ? (plan.adaptationHistory as AdaptationHistoryEntryDto[])
      : [];

    return {
      id: plan.id,
      userId: plan.userId,
      workspaceId: plan.workspaceId || '',
      documentId: plan.documentId || undefined,
      title: plan.title,
      goal: plan.goal || undefined,
      preferences: plan.preferences || { daysPerWeek: 3, minutesPerSession: 30 },
      lifecycleStatus: (plan.lifecycleStatus || (plan.isActive ? 'ACTIVE' : 'ARCHIVED')) as PlanLifecycleStatus,
      estimatedDurationWeeks: plan.estimatedDurationWeeks || Math.ceil(totalSessions / 3),
      adaptationHistory: rawHistory,
      sessions,
      progress: {
        totalSessions,
        completedSessions,
        percentComplete,
        currentSessionNumber: currentSession?.sessionNumber,
        estimatedMinutesRemaining,
      },
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }

  /**
   * Slice 1: Contextual tutor offer check.
   */
  async getPlanOffer(userId: string, workspaceId: string): Promise<PlanOfferDto> {
    const workspace = await this.getAuthorizedWorkspace(userId, workspaceId);

    // Check for an existing active plan
    const activePlan = await this.prisma.studyPlan.findFirst({
      where: {
        userId,
        workspaceId,
        isActive: true,
        lifecycleStatus: 'ACTIVE',
      },
      select: { id: true, title: true },
    });

    if (activePlan) {
      return {
        shouldOffer: false,
        dismissed: false,
        activePlanId: activePlan.id,
        activePlanTitle: activePlan.title,
      };
    }

    // Check if user dismissed offer previously
    const dismissedRecord = await this.prisma.studyPlan.findFirst({
      where: {
        userId,
        workspaceId,
        offerDismissed: true,
      },
      select: { id: true },
    });

    if (dismissedRecord) {
      return {
        shouldOffer: false,
        dismissed: true,
      };
    }

    const docTitle = workspace.document?.title || 'this textbook';
    return {
      shouldOffer: true,
      dismissed: false,
      recommendedGoal: `Master ${docTitle}`,
      reason: `Structured, adaptive study schedules grounded in ${docTitle} improve recall by up to 40%.`,
    };
  }

  /**
   * Slice 1: Dismiss the contextual tutor offer.
   */
  async dismissPlanOffer(userId: string, workspaceId: string): Promise<{ success: boolean }> {
    await this.getAuthorizedWorkspace(userId, workspaceId);

    // Record dismissed state on a placeholder or existing inactive study plan
    const existing = await this.prisma.studyPlan.findFirst({
      where: { userId, workspaceId },
    });

    if (existing) {
      await this.prisma.studyPlan.update({
        where: { id: existing.id },
        data: { offerDismissed: true },
      });
    } else {
      await this.prisma.studyPlan.create({
        data: {
          userId,
          workspaceId,
          title: 'Dismissed Offer Placeholder',
          isActive: false,
          lifecycleStatus: 'ARCHIVED',
          offerDismissed: true,
        },
      });
    }

    return { success: true };
  }

  /**
   * Slice 1: Generate a grounded plan preview from document chapters & student profile.
   */
  async generatePreview(
    userId: string,
    workspaceId: string,
    dto: CreatePlanPreviewDto,
  ): Promise<LearningPlanPreviewDto> {
    const workspace = await this.getAuthorizedWorkspace(userId, workspaceId);
    const document = workspace.document;

    const docTitle = document?.title || workspace.name || 'Textbook Material';
    const totalPages = document?.pageCount || 1;

    // Convert document sections into chapter segments
    const chapters = (document?.sections || []).map((sec, idx) => ({
      title: sec.title || `Chapter ${sec.chapterNumber || idx + 1}`,
      pageStart: sec.pageNumber || 1,
      pageEnd: sec.pageNumber || 1,
      sectionCount: 1,
    }));

    // If section end pages are missing, compute them from adjacent sections or totalPages
    for (let i = 0; i < chapters.length; i++) {
      const nextChapter = chapters[i + 1];
      if (nextChapter && nextChapter.pageStart > (chapters[i]?.pageStart ?? 0)) {
        chapters[i]!.pageEnd = nextChapter.pageStart - 1;
      } else if (i === chapters.length - 1) {
        chapters[i]!.pageEnd = totalPages;
      }
    }

    // Call @lernivox/ai-core plan generator
    const generated = generateLearningPlan({
      documentTitle: docTitle,
      totalPages,
      chapters,
      goal: dto.goal,
      daysPerWeek: dto.daysPerWeek,
      minutesPerSession: dto.minutesPerSession,
      targetOutcome: dto.targetOutcome,
      targetExamDate: dto.targetExamDate,
      selectedRange: dto.rangeScope
        ? {
            startPage: dto.rangeScope.startPage ?? undefined,
            endPage: dto.rangeScope.endPage ?? undefined,
            chapterTitle: dto.rangeScope.from?.chapterTitle ?? undefined,
          }
        : undefined,
    });

    if (!generated.success) {
      throw new BadRequestException(generated.error || 'Failed to generate plan preview.');
    }

    return {
      title: generated.title,
      goal: generated.goal,
      preferences: {
        daysPerWeek: dto.daysPerWeek,
        minutesPerSession: dto.minutesPerSession,
        targetOutcome: dto.targetOutcome,
        targetExamDate: dto.targetExamDate,
      },
      estimatedDurationWeeks: generated.estimatedDurationWeeks,
      totalSessions: generated.totalSessions,
      totalMinutes: generated.totalMinutes,
      sourceGroundingSummary: generated.sourceGroundingSummary,
      sessions: generated.sessions.map((s) => ({
        sessionNumber: s.sessionNumber,
        orderIndex: s.orderIndex,
        title: s.title,
        description: s.description,
        estimatedMinutes: s.estimatedMinutes,
        sourceChapter: s.sourceChapter,
        sourcePageStart: s.sourcePageStart,
        sourcePageEnd: s.sourcePageEnd,
        topicKey: s.topicKey,
        activities: s.activities,
      })),
    };
  }

  /**
   * Slice 2: Accept and persist an active learning plan with scheduled sessions.
   */
  async createPlan(
    userId: string,
    workspaceId: string,
    dto: AcceptPlanDto,
  ): Promise<LearningPlanDto> {
    const workspace = await this.getAuthorizedWorkspace(userId, workspaceId);
    const documentId = workspace.document?.id;

    if (!dto.sessions || dto.sessions.length === 0) {
      throw new BadRequestException('Study plan must contain at least one session.');
    }

    return this.prisma.$transaction(async (tx: any) => {
      // 1. Deactivate any existing active plans for this user in this workspace
      await tx.studyPlan.updateMany({
        where: {
          userId,
          workspaceId,
          isActive: true,
        },
        data: {
          isActive: false,
          lifecycleStatus: 'ARCHIVED',
        },
      });

      // 2. Schedule dates starting tomorrow, spaced across daysPerWeek
      const daysPerWeek = Math.max(1, Math.min(7, dto.preferences?.daysPerWeek || 3));
      const intervalDays = Math.max(1, Math.floor(7 / daysPerWeek));

      const now = new Date();
      let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const targetExamDate = dto.targetExamDate ? new Date(dto.targetExamDate) : null;
      const estimatedDurationWeeks = Math.max(
        1,
        Math.ceil(dto.sessions.length / daysPerWeek),
      );

      // 3. Create StudyPlan
      const plan = await tx.studyPlan.create({
        data: {
          userId,
          workspaceId,
          documentId,
          title: dto.title,
          goal: dto.goal,
          preferences: dto.preferences as any,
          lifecycleStatus: 'ACTIVE',
          isActive: true,
          estimatedDurationWeeks,
          targetExamDate,
          adaptationHistory: [],
        },
      });

      // 4. Create StudyScheduleItem for each session
      for (let i = 0; i < dto.sessions.length; i++) {
        const s = dto.sessions[i]!;
        const scheduledDate = new Date(currentDate);

        await tx.studyScheduleItem.create({
          data: {
            studyPlanId: plan.id,
            sessionNumber: s.sessionNumber || i + 1,
            orderIndex: i,
            scheduledDate,
            title: s.title,
            description: s.description,
            status: 'NOT_STARTED',
            activities: s.activities as any,
            sourceChapter: s.sourceChapter,
            sourcePageStart: s.sourcePageStart,
            sourcePageEnd: s.sourcePageEnd,
            topicKey: s.topicKey,
            estimatedMinutes: s.estimatedMinutes || dto.preferences?.minutesPerSession || 30,
            isCompleted: false,
          },
        });

        // Advance date for next session
        currentDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() + intervalDays,
        );
      }

      // Fetch created plan with ordered schedule items
      const savedPlan = await tx.studyPlan.findUniqueOrThrow({
        where: { id: plan.id },
        include: {
          scheduleItems: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      return this.formatLearningPlan(savedPlan);
    });
  }

  /**
   * Slice 2 & 4: Get active plan for this student and workspace.
   */
  async getActivePlan(userId: string, workspaceId: string): Promise<LearningPlanDto | null> {
    await this.getAuthorizedWorkspace(userId, workspaceId);

    const plan = await this.prisma.studyPlan.findFirst({
      where: {
        userId,
        workspaceId,
        isActive: true,
      },
      include: {
        scheduleItems: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!plan) {
      // Fallback: check if there's any plan at all
      const anyPlan = await this.prisma.studyPlan.findFirst({
        where: { userId, workspaceId, offerDismissed: false },
        include: {
          scheduleItems: {
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return anyPlan ? this.formatLearningPlan(anyPlan) : null;
    }

    return this.formatLearningPlan(plan);
  }

  /**
   * Slice 2: Update session status or toggle activity completion.
   */
  async updateSession(
    userId: string,
    workspaceId: string,
    sessionId: string,
    dto: UpdateSessionDto,
  ): Promise<LearningPlanDto> {
    await this.getAuthorizedWorkspace(userId, workspaceId);

    const session = await this.prisma.studyScheduleItem.findFirst({
      where: {
        id: sessionId,
        studyPlan: {
          userId,
          workspaceId,
        },
      },
      include: {
        studyPlan: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Study session not found.');
    }

    let updatedActivities = Array.isArray(session.activities)
      ? ([...session.activities] as unknown as PlanActivityDto[])
      : [];

    let isCompleted = session.isCompleted;
    let status = (session.status as SessionStatus) || 'NOT_STARTED';

    if (dto.activityId !== undefined) {
      updatedActivities = updatedActivities.map((act) => {
        if (act.id === dto.activityId) {
          return {
            ...act,
            completed: dto.activityCompleted ?? !act.completed,
          };
        }
        return act;
      });

      const allActivitiesDone =
        updatedActivities.length > 0 && updatedActivities.every((a) => a.completed);

      if (allActivitiesDone) {
        status = 'COMPLETED';
        isCompleted = true;
      } else if (updatedActivities.some((a) => a.completed)) {
        status = 'IN_PROGRESS';
      }
    }

    if (dto.status) {
      status = dto.status;
      isCompleted = dto.status === 'COMPLETED';
    }

    await this.prisma.studyScheduleItem.update({
      where: { id: sessionId },
      data: {
        status,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        activities: updatedActivities as any,
      },
    });

    // Check if all sessions in the plan are now completed
    const allSessions = await this.prisma.studyScheduleItem.findMany({
      where: { studyPlanId: session.studyPlanId },
    });
    const allDone = allSessions.every((s: any) => s.id === sessionId ? isCompleted : s.isCompleted);
    if (allDone && allSessions.length > 0) {
      await this.prisma.studyPlan.update({
        where: { id: session.studyPlanId },
        data: { lifecycleStatus: 'COMPLETED' },
      });
    }

    const updatedPlan = await this.prisma.studyPlan.findUniqueOrThrow({
      where: { id: session.studyPlanId },
      include: {
        scheduleItems: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return this.formatLearningPlan(updatedPlan);
  }

  /**
   * Slice 3: Evidence-based adaptive adjustment.
   */
  async adaptPlan(
    userId: string,
    workspaceId: string,
    dto: AdaptPlanDto,
  ): Promise<LearningPlanDto> {
    await this.getAuthorizedWorkspace(userId, workspaceId);

    const activePlan = await this.prisma.studyPlan.findFirst({
      where: {
        userId,
        workspaceId,
        isActive: true,
      },
      include: {
        scheduleItems: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!activePlan) {
      throw new NotFoundException('No active study plan found to adapt.');
    }

    // 1. Gather current student evidence from WorkspaceProgress
    const progress = await this.workspacesService.getWorkspaceProgress(userId, workspaceId);

    const topicMatrix = (progress.topics || []).map((t) => ({
      topicKey: t.id || t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      topicLabel: t.title,
      classification: t.status,
      accuracyPercent: t.successRate,
    }));

    const overdueFlashcardsCount = progress.flashcards.cardsDue;
    const recentFailedQuestionsCount = progress.assessment.totalFailedQuestions;
    const readingProgressPercent = progress.reading.percentage;

    const existingSessions = (activePlan.scheduleItems as any[]).map((s: any) => ({
      id: s.id,
      sessionNumber: s.sessionNumber,
      orderIndex: s.orderIndex,
      title: s.title,
      status: (s.status as SessionStatus) || (s.isCompleted ? 'COMPLETED' : 'NOT_STARTED'),
      sourceChapter: s.sourceChapter || undefined,
      sourcePageStart: s.sourcePageStart ?? undefined,
      sourcePageEnd: s.sourcePageEnd ?? undefined,
      topicKey: s.topicKey || undefined,
      activities: (Array.isArray(s.activities) ? s.activities : []) as GeneratedPlanActivity[],
      estimatedMinutes: s.estimatedMinutes,
    }));

    // 2. Call @lernivox/ai-core adaptLearningPlan
    const adaptation = adaptLearningPlan({
      existingSessions,
      topicMatrix,
      overdueFlashcardsCount,
      recentFailedQuestionsCount,
      readingProgressPercent,
    });

    if (!adaptation.adapted) {
      return this.formatLearningPlan(activePlan);
    }

    // 3. Persist modifications in transaction (completed sessions are NEVER touched)
    return this.prisma.$transaction(async (tx: any) => {
      // Delete uncompleted schedule items
      await tx.studyScheduleItem.deleteMany({
        where: {
          studyPlanId: activePlan.id,
          isCompleted: false,
        },
      });

      // Filter only new uncompleted sessions from adaptation
      const newPending = adaptation.updatedSessions.filter((s) => s.status !== 'COMPLETED');

      // Schedule dates starting tomorrow
      const daysPerWeek = (activePlan.preferences as any)?.daysPerWeek || 3;
      const intervalDays = Math.max(1, Math.floor(7 / daysPerWeek));

      const now = new Date();
      let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      for (const s of newPending) {
        await tx.studyScheduleItem.create({
          data: {
            studyPlanId: activePlan.id,
            sessionNumber: s.sessionNumber,
            orderIndex: s.orderIndex,
            scheduledDate: new Date(currentDate),
            title: s.title,
            description: (s as any).description || undefined,
            status: s.status || 'NOT_STARTED',
            activities: s.activities as any,
            sourceChapter: s.sourceChapter,
            sourcePageStart: s.sourcePageStart,
            sourcePageEnd: s.sourcePageEnd,
            topicKey: s.topicKey,
            estimatedMinutes: s.estimatedMinutes || 30,
            isCompleted: false,
          },
        });

        currentDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() + intervalDays,
        );
      }

      // Append adaptation history log
      const historyEntry: AdaptationHistoryEntryDto = {
        adaptedAt: new Date().toISOString(),
        trigger: dto.trigger === 'MANUAL' ? 'MANUAL' : 'QUIZ_PERFORMANCE',
        reason: adaptation.reason,
        modifications: adaptation.modifications,
      };

      const existingHistory = Array.isArray(activePlan.adaptationHistory)
        ? (activePlan.adaptationHistory as any[])
        : [];

      const updatedHistory = [...existingHistory, historyEntry];

      const saved = await tx.studyPlan.update({
        where: { id: activePlan.id },
        data: {
          adaptationHistory: updatedHistory as any,
        },
        include: {
          scheduleItems: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      return this.formatLearningPlan(saved);
    });
  }

  /**
   * Slice 4: Update plan lifecycle (ACTIVE | PAUSED | COMPLETED | ARCHIVED).
   */
  async updateLifecycle(
    userId: string,
    workspaceId: string,
    dto: UpdatePlanLifecycleDto,
  ): Promise<LearningPlanDto> {
    await this.getAuthorizedWorkspace(userId, workspaceId);

    const plan = await this.prisma.studyPlan.findFirst({
      where: {
        userId,
        workspaceId,
        isActive: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Active study plan not found.');
    }

    const updated = await this.prisma.studyPlan.update({
      where: { id: plan.id },
      data: {
        lifecycleStatus: dto.status,
        isActive: dto.status === 'ACTIVE',
      },
      include: {
        scheduleItems: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return this.formatLearningPlan(updated);
  }

  /**
   * Slice 4: In-app spotlight for the immediate next actionable session.
   */
  async getNextSession(
    userId: string,
    workspaceId: string,
  ): Promise<StudySessionDto | null> {
    const plan = await this.getActivePlan(userId, workspaceId);
    if (!plan) return null;

    const next = plan.sessions.find(
      (s) => s.status === 'IN_PROGRESS' || s.status === 'NOT_STARTED',
    );

    return next || null;
  }
}
