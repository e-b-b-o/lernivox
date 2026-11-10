import {
  PlanGenerationInput,
  GeneratedPlanResult,
  GeneratedPlanSession,
  GeneratedPlanActivity,
  AdaptPlanInput,
  AdaptPlanResult,
  PlanActivityType,
} from '../types/plan.types';

function generateActivityId(prefix: string, index: number): string {
  return `${prefix}-act-${index}-${Math.random().toString(36).substring(2, 7)}`;
}

function normalizeTopicKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generateLearningPlan(input: PlanGenerationInput): GeneratedPlanResult {
  if (!input.documentTitle) {
    return {
      success: false,
      title: 'Study Plan',
      goal: input.goal || 'Material Mastery',
      estimatedDurationWeeks: 0,
      totalSessions: 0,
      totalMinutes: 0,
      sourceGroundingSummary: { totalChapters: 0, pageCount: 0, focusTopics: [] },
      sessions: [],
      error: 'Document title is required to generate a study plan.',
    };
  }

  const daysPerWeek = Math.max(1, Math.min(7, input.daysPerWeek || 3));
  const minutesPerSession = Math.max(15, Math.min(120, input.minutesPerSession || 30));
  const totalPages = Math.max(1, input.totalPages || 1);

  // Prepare normalized chapter segments
  let effectiveChapters = (input.chapters || []).map((ch, idx) => ({
    title: ch.title || `Chapter ${idx + 1}`,
    pageStart: Math.max(1, ch.pageStart || 1),
    pageEnd: Math.max(ch.pageStart || 1, ch.pageEnd || ch.pageStart || 1),
    sectionCount: ch.sectionCount || 1,
  }));

  // If no chapters were provided, divide total pages into ~15-page logical chapters
  if (effectiveChapters.length === 0) {
    const pagesPerChapter = Math.max(10, Math.min(25, Math.ceil(totalPages / 5)));
    let curPage = 1;
    let chNum = 1;
    while (curPage <= totalPages) {
      const end = Math.min(totalPages, curPage + pagesPerChapter - 1);
      effectiveChapters.push({
        title: `Section ${chNum}: Pages ${curPage}–${end}`,
        pageStart: curPage,
        pageEnd: end,
        sectionCount: 1,
      });
      curPage = end + 1;
      chNum++;
    }
  }

  // Filter if selectedRange is specified
  if (input.selectedRange) {
    const { startPage, endPage, chapterTitle } = input.selectedRange;
    if (chapterTitle) {
      effectiveChapters = effectiveChapters.filter((c) =>
        c.title.toLowerCase().includes(chapterTitle.toLowerCase())
      );
    } else if (startPage && endPage) {
      effectiveChapters = effectiveChapters.filter(
        (c) => c.pageEnd >= startPage && c.pageStart <= endPage
      );
    }
  }

  if (effectiveChapters.length === 0) {
    // Fallback to full range
    effectiveChapters = [
      {
        title: 'Core Material',
        pageStart: 1,
        pageEnd: totalPages,
        sectionCount: 1,
      },
    ];
  }

  const focusTopics: string[] = [];
  const sessions: GeneratedPlanSession[] = [];
  let sessionCounter = 1;

  for (const chapter of effectiveChapters) {
    focusTopics.push(chapter.title);
    const chapterPages = Math.max(1, chapter.pageEnd - chapter.pageStart + 1);
    
    // Determine how many sessions for this chapter (typically 10-15 pages per session)
    const sessionsForChapter = Math.max(1, Math.ceil(chapterPages / 15));
    const pagesPerSession = Math.ceil(chapterPages / sessionsForChapter);

    for (let s = 0; s < sessionsForChapter; s++) {
      const sStart = chapter.pageStart + s * pagesPerSession;
      const sEnd = Math.min(chapter.pageEnd, sStart + pagesPerSession - 1);
      const isLastInChapter = s === sessionsForChapter - 1;
      const topicKey = normalizeTopicKey(chapter.title);

      // Distribute activities within target session time
      const readMinutes = Math.round(minutesPerSession * 0.4);
      const explainMinutes = Math.round(minutesPerSession * 0.2);
      const quizMinutes = isLastInChapter ? Math.round(minutesPerSession * 0.25) : Math.round(minutesPerSession * 0.2);
      const flashcardMinutes = minutesPerSession - readMinutes - explainMinutes - quizMinutes;

      const activities: GeneratedPlanActivity[] = [
        {
          id: generateActivityId('act-read', sessionCounter),
          type: 'READ',
          title: `Read ${chapter.title} (pp. ${sStart}–${sEnd})`,
          description: `Active reading of primary text material from page ${sStart} to ${sEnd}.`,
          estimatedMinutes: readMinutes,
          completed: false,
          pageStart: sStart,
          pageEnd: sEnd,
          chapter: chapter.title,
          topicKey,
        },
        {
          id: generateActivityId('act-explain', sessionCounter),
          type: 'EXPLAIN',
          title: `Key Concepts Review with AI Tutor`,
          description: `Engage with AI Tutor to clarify core terminology, mechanisms, and examples from pages ${sStart}–${sEnd}.`,
          estimatedMinutes: explainMinutes,
          completed: false,
          pageStart: sStart,
          pageEnd: sEnd,
          chapter: chapter.title,
          topicKey,
        },
        {
          id: generateActivityId('act-quiz', sessionCounter),
          type: 'QUIZ',
          title: isLastInChapter
            ? `Chapter Mastery Assessment: ${chapter.title}`
            : `Section Checkpoint Quiz (pp. ${sStart}–${sEnd})`,
          description: `Evaluate conceptual understanding with an interactive assessment.`,
          estimatedMinutes: quizMinutes,
          completed: false,
          pageStart: sStart,
          pageEnd: sEnd,
          chapter: chapter.title,
          topicKey,
        },
        {
          id: generateActivityId('act-cards', sessionCounter),
          type: 'FLASHCARDS',
          title: `Spaced Repetition Practice`,
          description: `Review active flashcard deck to solidify definitions and formulas into long-term recall.`,
          estimatedMinutes: Math.max(5, flashcardMinutes),
          completed: false,
          chapter: chapter.title,
          topicKey,
        },
      ];

      sessions.push({
        sessionNumber: sessionCounter,
        orderIndex: sessionCounter - 1,
        title: sessionsForChapter === 1
          ? chapter.title
          : `${chapter.title} — Part ${s + 1} (pp. ${sStart}–${sEnd})`,
        description: `Study session focusing on ${chapter.title}, covering pages ${sStart} through ${sEnd}.`,
        estimatedMinutes: minutesPerSession,
        sourceChapter: chapter.title,
        sourcePageStart: sStart,
        sourcePageEnd: sEnd,
        topicKey,
        activities,
      });

      sessionCounter++;
    }
  }

  const totalSessions = sessions.length;
  const estimatedDurationWeeks = Math.max(1, Math.ceil(totalSessions / daysPerWeek));
  const totalMinutes = totalSessions * minutesPerSession;

  const planTitle = input.goal
    ? `${input.documentTitle} — ${input.goal}`
    : `${input.documentTitle} Study Plan`;

  return {
    success: true,
    title: planTitle,
    goal: input.goal || 'Comprehensive Material Mastery',
    estimatedDurationWeeks,
    totalSessions,
    totalMinutes,
    sourceGroundingSummary: {
      totalChapters: effectiveChapters.length,
      pageCount: effectiveChapters.reduce((acc, c) => acc + (c.pageEnd - c.pageStart + 1), 0),
      focusTopics,
    },
    sessions,
  };
}

export function adaptLearningPlan(input: AdaptPlanInput): AdaptPlanResult {
  const existing = input.existingSessions || [];
  if (existing.length === 0) {
    return {
      adapted: false,
      reason: 'No existing sessions found to adapt.',
      modifications: [],
      updatedSessions: [],
    };
  }

  // Preserve completed sessions completely unchanged
  const completedSessions = existing.filter((s) => s.status === 'COMPLETED');
  const pendingSessions = existing.filter((s) => s.status !== 'COMPLETED');

  if (pendingSessions.length === 0) {
    return {
      adapted: false,
      reason: 'All sessions are already completed. Plan is fully accomplished.',
      modifications: [],
      updatedSessions: existing,
    };
  }

  const modifications: string[] = [];
  const needsReviewTopics = (input.topicMatrix || []).filter(
    (t) => t.classification === 'NEEDS_REVIEW' || t.accuracyPercent < 70
  );

  let newPendingSessions = [...pendingSessions];

  // 1. Topic Understanding Matrix adaptation: Insert review sessions for topics needing reinforcement
  if (needsReviewTopics.length > 0) {
    for (const weakTopic of needsReviewTopics) {
      // Check if a review session for this topic is already scheduled among pending
      const alreadyScheduled = newPendingSessions.some(
        (s) => s.topicKey === weakTopic.topicKey && s.title.startsWith('Targeted Review:')
      );

      if (!alreadyScheduled) {
        const reviewSession: any = {
          sessionNumber: 0, // renumbered later
          orderIndex: 0,
          title: `Targeted Review: ${weakTopic.topicLabel}`,
          description: `Dedicated reinforcement session addressing identified weaknesses in ${weakTopic.topicLabel} (recent accuracy: ${Math.round(weakTopic.accuracyPercent)}%).`,
          status: 'NOT_STARTED',
          sourceChapter: weakTopic.topicLabel,
          topicKey: weakTopic.topicKey,
          estimatedMinutes: 30,
          activities: [
            {
              id: generateActivityId('act-review-ai', 99),
              type: 'EXPLAIN' as PlanActivityType,
              title: `Concept Clarification: ${weakTopic.topicLabel}`,
              description: `Ask AI Tutor to break down difficult concepts and address prior incorrect quiz questions.`,
              estimatedMinutes: 10,
              completed: false,
              topicKey: weakTopic.topicKey,
            },
            {
              id: generateActivityId('act-review-quiz', 99),
              type: 'QUIZ' as PlanActivityType,
              title: `Reinforcement Quiz: ${weakTopic.topicLabel}`,
              description: `Retest understanding with targeted questions focusing on previously missed areas.`,
              estimatedMinutes: 12,
              completed: false,
              topicKey: weakTopic.topicKey,
            },
            {
              id: generateActivityId('act-review-cards', 99),
              type: 'FLASHCARDS' as PlanActivityType,
              title: `Flashcard Drill: ${weakTopic.topicLabel}`,
              description: `Intensive recall practice for core definitions.`,
              estimatedMinutes: 8,
              completed: false,
              topicKey: weakTopic.topicKey,
            },
          ],
        };

        // Insert at the front of pending sessions so the student reinforces fundamentals before proceeding
        newPendingSessions.unshift(reviewSession);
        modifications.push(
          `Injected targeted review session for "${weakTopic.topicLabel}" due to low quiz accuracy (${Math.round(weakTopic.accuracyPercent)}%).`
        );
      }
    }
  }

  // 2. Flashcard SM-2 Overdue Card Adaptation
  if (input.overdueFlashcardsCount > 5 && newPendingSessions.length > 0) {
    const nextSession = newPendingSessions[0];
    if (nextSession) {
      const hasSpacedRepActivity = nextSession.activities.some((a) => a.type === 'FLASHCARDS');

      if (!hasSpacedRepActivity) {
        nextSession.activities.push({
          id: generateActivityId('act-overdue-cards', nextSession.sessionNumber),
          type: 'FLASHCARDS',
          title: `Spaced Repetition: Catch Up Due Cards`,
          description: `Clear ${input.overdueFlashcardsCount} overdue cards to maintain SM-2 retention schedule.`,
          estimatedMinutes: 10,
          completed: false,
        });
        nextSession.estimatedMinutes += 10;
        modifications.push(
          `Added flashcard catch-up activity to ${nextSession.title} (${input.overdueFlashcardsCount} overdue cards).`
        );
      } else {
        const cardAct = nextSession.activities.find((a) => a.type === 'FLASHCARDS');
        if (cardAct) {
          cardAct.title = `Spaced Repetition: Catch Up ${input.overdueFlashcardsCount} Due Cards`;
          cardAct.estimatedMinutes = Math.max(cardAct.estimatedMinutes, 10);
          modifications.push(
            `Prioritized flashcard activity in ${nextSession.title} (${input.overdueFlashcardsCount} cards due for review).`
          );
        }
      }
    }
  }

  // 3. High Mastery Acceleration Check
  const confidentTopics = (input.topicMatrix || []).filter(
    (t) => t.classification === 'CONFIDENT' && t.accuracyPercent >= 85
  );
  if (confidentTopics.length >= 2 && needsReviewTopics.length === 0) {
    modifications.push(
      `Paced upcoming sessions efficiently to reflect verified high mastery across completed topics (${confidentTopics.length} topics confident).`
    );
  }

  // Re-number and re-order pending sessions sequentially following completed sessions
  let nextNumber = completedSessions.length + 1;
  const mergedSessions = [
    ...completedSessions,
    ...newPendingSessions.map((s, idx) => ({
      ...s,
      sessionNumber: nextNumber++,
      orderIndex: completedSessions.length + idx,
    })),
  ];

  const adapted = modifications.length > 0;
  const reason = adapted
    ? `Adapted study schedule based on learning metrics: ${modifications.join(' ')}`
    : 'Current plan remains well-calibrated with your learning progress. No modifications necessary.';

  return {
    adapted,
    reason,
    modifications,
    updatedSessions: mergedSessions,
  };
}
