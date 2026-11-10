import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateLearningPlan,
  adaptLearningPlan,
} from '../dist/index.js';

describe('AI Core Learning Plan Generator & Adaptive Engine Suite', () => {
  const sampleChapters = [
    { title: 'Chapter 1: The Role of Algorithms', pageStart: 5, pageEnd: 22, sectionCount: 2 },
    { title: 'Chapter 2: Getting Started with Sorting', pageStart: 23, pageEnd: 48, sectionCount: 3 },
    { title: 'Chapter 3: Characterizing Running Times', pageStart: 49, pageEnd: 68, sectionCount: 2 },
  ];

  it('1. should generate a structured, grounded study plan from textbook chapters', () => {
    const result = generateLearningPlan({
      documentTitle: 'Introduction to Algorithms',
      totalPages: 70,
      chapters: sampleChapters,
      goal: 'Prepare for Midterm Exam',
      daysPerWeek: 3,
      minutesPerSession: 30,
    });

    assert.equal(result.success, true);
    assert.match(result.title, /Introduction to Algorithms — Prepare for Midterm Exam/);
    assert.ok(result.totalSessions > 0);
    assert.ok(result.estimatedDurationWeeks >= 1);
    assert.equal(result.sourceGroundingSummary.totalChapters, 3);
    assert.equal(result.sourceGroundingSummary.focusTopics.length, 3);

    // Verify first session has grounded activities
    const firstSession = result.sessions[0];
    assert.ok(firstSession);
    assert.equal(firstSession.sessionNumber, 1);
    assert.equal(firstSession.orderIndex, 0);
    assert.equal(firstSession.estimatedMinutes, 30);
    assert.ok(firstSession.activities.length >= 4);

    const readAct = firstSession.activities.find((a) => a.type === 'READ');
    assert.ok(readAct);
    assert.equal(readAct.completed, false);
    assert.ok((readAct.estimatedMinutes ?? 0) > 0);

    const quizAct = firstSession.activities.find((a) => a.type === 'QUIZ');
    assert.ok(quizAct);

    const cardsAct = firstSession.activities.find((a) => a.type === 'FLASHCARDS');
    assert.ok(cardsAct);
  });

  it('2. should handle documents without predefined chapters by partitioning pages logically', () => {
    const result = generateLearningPlan({
      documentTitle: 'Machine Learning Notes',
      totalPages: 60,
      chapters: [],
      goal: 'Master Fundamentals',
      daysPerWeek: 4,
      minutesPerSession: 45,
    });

    assert.equal(result.success, true);
    assert.ok(result.sessions.length >= 3);
    assert.ok(result.sessions[0].sourcePageStart >= 1);
    assert.ok(result.sessions[0].sourcePageEnd > result.sessions[0].sourcePageStart);
  });

  it('3. should respect selected range scope when provided', () => {
    const result = generateLearningPlan({
      documentTitle: 'Introduction to Algorithms',
      totalPages: 70,
      chapters: sampleChapters,
      goal: 'Focus on Sorting',
      daysPerWeek: 2,
      minutesPerSession: 30,
      selectedRange: {
        chapterTitle: 'Sorting',
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.sourceGroundingSummary.totalChapters, 1);
    assert.ok(result.sessions.every((s) => s.sourceChapter.includes('Sorting')));
  });

  it('4. should adapt plan by injecting targeted review sessions for NEEDS_REVIEW topics and catching up overdue flashcards', () => {
    const initialPlan = generateLearningPlan({
      documentTitle: 'Introduction to Algorithms',
      totalPages: 70,
      chapters: sampleChapters,
      goal: 'Comprehensive Study',
      daysPerWeek: 3,
      minutesPerSession: 30,
    });

    const sessions = initialPlan.sessions.map((s, idx) => ({
      id: `session-${idx + 1}`,
      sessionNumber: s.sessionNumber,
      orderIndex: s.orderIndex,
      title: s.title,
      status: idx === 0 ? ('COMPLETED' as const) : ('NOT_STARTED' as const),
      sourceChapter: s.sourceChapter,
      sourcePageStart: s.sourcePageStart,
      sourcePageEnd: s.sourcePageEnd,
      topicKey: s.topicKey,
      activities: s.activities,
      estimatedMinutes: s.estimatedMinutes,
    }));

    const adaptedResult = adaptLearningPlan({
      existingSessions: sessions,
      topicMatrix: [
        {
          topicKey: 'chapter-1-the-role-of-algorithms',
          topicLabel: 'Chapter 1: The Role of Algorithms',
          classification: 'NEEDS_REVIEW',
          accuracyPercent: 55,
        },
      ],
      overdueFlashcardsCount: 12,
      recentFailedQuestionsCount: 4,
      readingProgressPercent: 25,
    });

    assert.equal(adaptedResult.adapted, true);
    assert.ok(adaptedResult.modifications.length >= 2);

    // Completed session 1 must still be COMPLETED and unchanged
    assert.equal(adaptedResult.updatedSessions[0].id, 'session-1');
    assert.equal(adaptedResult.updatedSessions[0].status, 'COMPLETED');

    // Injected review session should appear as session 2
    const reviewSession = adaptedResult.updatedSessions[1];
    assert.ok(reviewSession);
    assert.equal(reviewSession.sessionNumber, 2);
    assert.match(reviewSession.title, /Targeted Review: Chapter 1/);

    // Flashcard catch-up should be prioritized
    const nextPending = adaptedResult.updatedSessions.find((s) => s.status !== 'COMPLETED');
    assert.ok(nextPending);
  });

  it('5. should not alter sessions if everything is already completed', () => {
    const completedSessions = [
      {
        id: 's-1',
        sessionNumber: 1,
        orderIndex: 0,
        title: 'Finished Session',
        status: 'COMPLETED' as const,
        activities: [],
        estimatedMinutes: 30,
      },
    ];

    const result = adaptLearningPlan({
      existingSessions: completedSessions,
      topicMatrix: [],
      overdueFlashcardsCount: 0,
      recentFailedQuestionsCount: 0,
      readingProgressPercent: 100,
    });

    assert.equal(result.adapted, false);
    assert.equal(result.updatedSessions.length, 1);
  });
});

