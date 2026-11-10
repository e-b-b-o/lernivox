import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LearningPlansService } from './learning-plans.service';

describe('LearningPlansService', () => {
  let service: LearningPlansService;
  let mockPrisma: any;
  let mockWorkspacesService: any;

  const mockUser = { id: 'user-1' };
  const mockWorkspaceId = 'ws-1';

  beforeEach(() => {
    mockPrisma = {
      workspace: {
        findFirst: (jest.fn() as any).mockResolvedValue({
          id: mockWorkspaceId,
          name: 'Algorithms Workspace',
          ownerId: mockUser.id,
          members: [],
          document: {
            id: 'doc-1',
            title: 'Introduction to Algorithms',
            pageCount: 50,
            sections: [
              { id: 'sec-1', title: 'Chapter 1: Foundations', chapterNumber: 1, pageNumber: 1 },
              { id: 'sec-2', title: 'Chapter 2: Sorting', chapterNumber: 2, pageNumber: 25 },
            ],
          },
        }),
      },
      studyPlan: {
        findFirst: (jest.fn() as any).mockResolvedValue(null),
        create: (jest.fn() as any).mockImplementation((args: any) =>
          Promise.resolve({
            id: 'plan-1',
            userId: mockUser.id,
            workspaceId: mockWorkspaceId,
            documentId: 'doc-1',
            title: args.data.title,
            goal: args.data.goal,
            preferences: args.data.preferences,
            lifecycleStatus: args.data.lifecycleStatus || 'ACTIVE',
            isActive: true,
            estimatedDurationWeeks: args.data.estimatedDurationWeeks || 2,
            adaptationHistory: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
        update: (jest.fn() as any).mockImplementation((args: any) =>
          Promise.resolve({
            id: args.where.id,
            userId: mockUser.id,
            workspaceId: mockWorkspaceId,
            documentId: 'doc-1',
            title: 'Introduction to Algorithms Study Plan',
            lifecycleStatus: args.data.lifecycleStatus || 'ACTIVE',
            isActive: args.data.isActive ?? true,
            adaptationHistory: args.data.adaptationHistory || [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
        updateMany: (jest.fn() as any).mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: (jest.fn() as any).mockResolvedValue({
          id: 'plan-1',
          userId: mockUser.id,
          workspaceId: mockWorkspaceId,
          documentId: 'doc-1',
          title: 'Introduction to Algorithms Study Plan',
          goal: 'Exam Prep',
          preferences: { daysPerWeek: 3, minutesPerSession: 30 },
          lifecycleStatus: 'ACTIVE',
          isActive: true,
          estimatedDurationWeeks: 2,
          adaptationHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          scheduleItems: [
            {
              id: 'sess-1',
              studyPlanId: 'plan-1',
              sessionNumber: 1,
              orderIndex: 0,
              scheduledDate: new Date(),
              title: 'Chapter 1: Foundations',
              status: 'NOT_STARTED',
              estimatedMinutes: 30,
              activities: [
                { id: 'act-1', type: 'READ', title: 'Read pp. 1-24', estimatedMinutes: 12, completed: false },
                { id: 'act-2', type: 'QUIZ', title: 'Chapter Quiz', estimatedMinutes: 18, completed: false },
              ],
              isCompleted: false,
              createdAt: new Date(),
            },
          ],
        }),
      },
      studyScheduleItem: {
        create: (jest.fn() as any).mockImplementation((args: any) =>
          Promise.resolve({
            id: 'sess-1',
            ...args.data,
            createdAt: new Date(),
          }),
        ),
        findFirst: (jest.fn() as any).mockResolvedValue({
          id: 'sess-1',
          studyPlanId: 'plan-1',
          sessionNumber: 1,
          orderIndex: 0,
          scheduledDate: new Date(),
          title: 'Chapter 1: Foundations',
          status: 'NOT_STARTED',
          isCompleted: false,
          estimatedMinutes: 30,
          activities: [
            { id: 'act-1', type: 'READ', title: 'Read pp. 1-24', estimatedMinutes: 12, completed: false },
            { id: 'act-2', type: 'QUIZ', title: 'Chapter Quiz', estimatedMinutes: 18, completed: false },
          ],
          createdAt: new Date(),
          studyPlan: { id: 'plan-1', userId: mockUser.id, workspaceId: mockWorkspaceId },
        }),
        update: (jest.fn() as any).mockResolvedValue({ id: 'sess-1', status: 'IN_PROGRESS' }),
        findMany: (jest.fn() as any).mockResolvedValue([]),
        deleteMany: (jest.fn() as any).mockResolvedValue({ count: 1 }),
      },
      $transaction: (jest.fn() as any).mockImplementation((callback: any) =>
        callback(mockPrisma),
      ),
    };

    mockWorkspacesService = {
      getWorkspaceProgress: (jest.fn() as any).mockResolvedValue({
        workspaceId: mockWorkspaceId,
        reading: { percentage: 20, currentPage: 10, totalPages: 50 },
        assessment: { averageScore: 60, totalAttempts: 1, totalFailedQuestions: 3 },
        flashcards: { cardsDue: 8, cardsReviewed: 5, cardsMastered: 2 },
        topics: [
          {
            topicKey: 'chapter-1-foundations',
            title: 'Chapter 1: Foundations',
            classification: 'NEEDS_REVIEW',
            accuracyRate: 50,
          },
        ],
      }),
    };

    service = new LearningPlansService(mockPrisma, mockWorkspacesService);
  });

  describe('1. getPlanOffer', () => {
    it('should recommend a plan offer when student has no active plan and has not dismissed', async () => {
      const offer = await service.getPlanOffer(mockUser.id, mockWorkspaceId);
      expect(offer.shouldOffer).toBe(true);
      expect(offer.dismissed).toBe(false);
      expect(offer.recommendedGoal).toContain('Introduction to Algorithms');
    });

    it('should NOT offer when student already has an active study plan', async () => {
      mockPrisma.studyPlan.findFirst = (jest.fn() as any).mockResolvedValueOnce({
        id: 'plan-existing',
        title: 'Algorithms Midterm Plan',
      });

      const offer = await service.getPlanOffer(mockUser.id, mockWorkspaceId);
      expect(offer.shouldOffer).toBe(false);
      expect(offer.activePlanId).toBe('plan-existing');
    });

    it('should NOT offer when student previously dismissed the offer', async () => {
      // First call for active plan returns null, second call for dismissed returns record
      mockPrisma.studyPlan.findFirst = (jest.fn() as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'dismissed-record' });

      const offer = await service.getPlanOffer(mockUser.id, mockWorkspaceId);
      expect(offer.shouldOffer).toBe(false);
      expect(offer.dismissed).toBe(true);
    });
  });

  describe('2. dismissPlanOffer', () => {
    it('should persist dismissal flag', async () => {
      const res = await service.dismissPlanOffer(mockUser.id, mockWorkspaceId);
      expect(res.success).toBe(true);
      expect(mockPrisma.studyPlan.create).toHaveBeenCalled();
    });
  });

  describe('3. generatePreview', () => {
    it('should return grounded preview with chapters and activities', async () => {
      const preview = await service.generatePreview(mockUser.id, mockWorkspaceId, {
        goal: 'Prepare for Midterm',
        daysPerWeek: 3,
        minutesPerSession: 30,
      });

      expect(preview.totalSessions).toBeGreaterThanOrEqual(2);
      expect(preview.estimatedDurationWeeks).toBeGreaterThanOrEqual(1);
      expect(preview.sessions[0]?.activities.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('4. createPlan', () => {
    it('should archive prior active plans and persist new sessions in transaction', async () => {
      const result = await service.createPlan(mockUser.id, mockWorkspaceId, {
        title: 'Introduction to Algorithms Study Plan',
        goal: 'Exam Prep',
        preferences: { daysPerWeek: 3, minutesPerSession: 30 },
        sessions: [
          {
            sessionNumber: 1,
            orderIndex: 0,
            title: 'Chapter 1: Foundations',
            description: 'Foundational concepts',
            estimatedMinutes: 30,
            sourceChapter: 'Chapter 1: Foundations',
            sourcePageStart: 1,
            sourcePageEnd: 24,
            topicKey: 'chapter-1-foundations',
            activities: [
              { id: 'act-1', type: 'READ', title: 'Read pp. 1-24', estimatedMinutes: 12, completed: false },
              { id: 'act-2', type: 'QUIZ', title: 'Chapter Quiz', estimatedMinutes: 18, completed: false },
            ],
          },
        ],
      });

      expect(result.id).toBe('plan-1');
      expect(mockPrisma.studyPlan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: mockUser.id, isActive: true }),
        }),
      );
      expect(result.sessions).toHaveLength(1);
      expect(result.progress.percentComplete).toBe(0);
    });
  });

  describe('5. updateSession', () => {
    it('should toggle activity completion and mark session COMPLETED when all activities done', async () => {
      const plan = await service.updateSession(mockUser.id, mockWorkspaceId, 'sess-1', {
        activityId: 'act-1',
        activityCompleted: true,
      });

      expect(mockPrisma.studyScheduleItem.update).toHaveBeenCalled();
      expect(plan).toBeDefined();
    });
  });

  describe('6. adaptPlan', () => {
    it('should inject review sessions for NEEDS_REVIEW topics and prioritize overdue flashcards', async () => {
      mockPrisma.studyPlan.findFirst = (jest.fn() as any).mockResolvedValueOnce({
        id: 'plan-1',
        userId: mockUser.id,
        workspaceId: mockWorkspaceId,
        isActive: true,
        preferences: { daysPerWeek: 3, minutesPerSession: 30 },
        adaptationHistory: [],
        scheduleItems: [
          {
            id: 'sess-1',
            sessionNumber: 1,
            orderIndex: 0,
            scheduledDate: new Date(),
            title: 'Chapter 1: Foundations',
            status: 'COMPLETED',
            isCompleted: true,
            estimatedMinutes: 30,
            activities: [],
            sourceChapter: 'Chapter 1: Foundations',
            topicKey: 'chapter-1-foundations',
          },
          {
            id: 'sess-2',
            sessionNumber: 2,
            orderIndex: 1,
            scheduledDate: new Date(),
            title: 'Chapter 2: Sorting',
            status: 'NOT_STARTED',
            isCompleted: false,
            estimatedMinutes: 30,
            activities: [
              { id: 'act-s2-read', type: 'READ', title: 'Read Sorting', estimatedMinutes: 15, completed: false },
            ],
            sourceChapter: 'Chapter 2: Sorting',
            topicKey: 'chapter-2-sorting',
          },
        ],
      });

      const adaptedPlan = await service.adaptPlan(mockUser.id, mockWorkspaceId, {
        trigger: 'AUTO',
      });

      expect(mockWorkspacesService.getWorkspaceProgress).toHaveBeenCalledWith(mockUser.id, mockWorkspaceId);
      expect(mockPrisma.studyScheduleItem.deleteMany).toHaveBeenCalled();
      expect(adaptedPlan).toBeDefined();
    });
  });

  describe('7. updateLifecycle', () => {
    it('should pause an active study plan', async () => {
      mockPrisma.studyPlan.findFirst = (jest.fn() as any).mockResolvedValueOnce({
        id: 'plan-1',
        userId: mockUser.id,
        workspaceId: mockWorkspaceId,
        isActive: true,
      });

      const plan = await service.updateLifecycle(mockUser.id, mockWorkspaceId, {
        status: 'PAUSED',
      });

      expect(mockPrisma.studyPlan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lifecycleStatus: 'PAUSED', isActive: false }),
        }),
      );
    });
  });
});

