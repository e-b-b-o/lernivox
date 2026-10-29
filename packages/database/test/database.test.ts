import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma, storeChunkVector, searchSimilarChunks } from '../dist/index.js';
import {
  Role,
  PlanTier,
  AuthProvider,
  DifficultyLevel,
  ExplanationLength,
  TeachingStyle,
  ThemePreference,
  CourseMemberRole,
  DocumentStatus,
  DocumentVisibility,
  StorageProvider,
  MaterialType,
  QuestionType,
  StudyGroupRole,
  SharePermission,
} from '@prisma/client';

describe('Lernivox Domain Data Model & pgvector Tests', () => {
  const testRunId = `test_${Date.now()}`;
  let testUserId: string;
  let testCourseId: string;
  let testDocumentId: string;
  let testChunkId: string;
  let testQuizId: string;

  before(async () => {
    // Ensure database connection
    await prisma.$connect();
  });

  after(async () => {
    // Clean up test data if user exists
    if (testUserId) {
      await prisma.user.deleteMany({
        where: { id: testUserId },
      });
    }
    await prisma.$disconnect();
  });

  it('1. should create and retrieve a user with identities and preferences', async () => {
    const email = `${testRunId}_alex@lernivox.test`;
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Alex Test',
        role: Role.USER,
        planTier: PlanTier.PRO,
        identities: {
          create: {
            provider: AuthProvider.EMAIL_PASSWORD,
            providerAccountId: email,
            passwordHash: 'dummy_hash_for_testing',
          },
        },
        preferences: {
          create: {
            difficulty: DifficultyLevel.INTERMEDIATE,
            explanationLength: ExplanationLength.BALANCED,
            teachingStyle: TeachingStyle.SOCRATIC,
            dailyStudyTargetMinutes: 30,
            theme: ThemePreference.SYSTEM,
          },
        },
      },
      include: {
        identities: true,
        preferences: true,
      },
    });

    assert.ok(user.id);
    assert.equal(user.email, email);
    assert.equal(user.role, Role.USER);
    assert.equal(user.planTier, PlanTier.PRO);
    assert.equal(user.identities.length, 1);
    assert.equal(user.identities[0].provider, AuthProvider.EMAIL_PASSWORD);
    assert.ok(user.preferences);
    assert.equal(user.preferences.difficulty, DifficultyLevel.INTERMEDIATE);
    assert.equal(user.preferences.dailyStudyTargetMinutes, 30);

    testUserId = user.id;
  });

  it('2. should create and retrieve a course with ownership membership', async () => {
    const course = await prisma.course.create({
      data: {
        ownerId: testUserId,
        name: 'CS-101: Test Algorithms',
        code: `CS101-${testRunId}`,
        description: 'Test algorithm course',
        members: {
          create: {
            userId: testUserId,
            role: CourseMemberRole.OWNER,
          },
        },
      },
      include: {
        members: true,
      },
    });

    assert.ok(course.id);
    assert.equal(course.name, 'CS-101: Test Algorithms');
    assert.equal(course.members.length, 1);
    assert.equal(course.members[0].userId, testUserId);
    assert.equal(course.members[0].role, CourseMemberRole.OWNER);

    testCourseId = course.id;
  });

  it('3. should enforce course membership uniqueness', async () => {
    await assert.rejects(
      async () => {
        await prisma.courseMember.create({
          data: {
            courseId: testCourseId,
            userId: testUserId,
            role: CourseMemberRole.STUDENT,
          },
        });
      },
      (err: any) => {
        // Prisma P2002 error code for unique constraint violation
        return err.code === 'P2002';
      },
      'Expected unique constraint violation when adding duplicate course member',
    );
  });

  it('4. should create central library document and associate with courses without duplication', async () => {
    // Create central document
    const document = await prisma.document.create({
      data: {
        ownerId: testUserId,
        title: 'CLRS Algorithms Test Chapter',
        fileName: 'clrs_test.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1048576,
        storagePath: 'documents/test/clrs_test.pdf',
        storageProvider: StorageProvider.LOCAL,
        visibility: DocumentVisibility.PRIVATE,
        status: DocumentStatus.UPLOADED,
      },
    });

    assert.ok(document.id);
    assert.equal(document.visibility, DocumentVisibility.PRIVATE);
    assert.equal(document.status, DocumentStatus.UPLOADED);
    testDocumentId = document.id;

    // Associate with course
    const courseDoc = await prisma.courseDocument.create({
      data: {
        courseId: testCourseId,
        documentId: document.id,
        addedById: testUserId,
      },
    });

    assert.equal(courseDoc.courseId, testCourseId);
    assert.equal(courseDoc.documentId, testDocumentId);

    // Create a second course and associate the same document
    const secondCourse = await prisma.course.create({
      data: {
        ownerId: testUserId,
        name: 'CS-201: Advanced Structures',
        code: `CS201-${testRunId}`,
        members: {
          create: {
            userId: testUserId,
            role: CourseMemberRole.OWNER,
          },
        },
      },
    });

    await prisma.courseDocument.create({
      data: {
        courseId: secondCourse.id,
        documentId: testDocumentId,
        addedById: testUserId,
      },
    });

    const docAssociations = await prisma.courseDocument.findMany({
      where: { documentId: testDocumentId },
    });

    assert.equal(docAssociations.length, 2);

    // Clean up second course
    await prisma.course.delete({ where: { id: secondCourse.id } });
  });

  it('5. should record document-processing lifecycle and status transitions', async () => {
    // Transition to PROCESSING
    const startedAt = new Date();
    const processingDoc = await prisma.document.update({
      where: { id: testDocumentId },
      data: {
        status: DocumentStatus.PROCESSING,
        processingStartedAt: startedAt,
      },
    });

    assert.equal(processingDoc.status, DocumentStatus.PROCESSING);
    assert.ok(processingDoc.processingStartedAt);

    // Transition to READY with metadata
    const completedAt = new Date();
    const readyDoc = await prisma.document.update({
      where: { id: testDocumentId },
      data: {
        status: DocumentStatus.READY,
        processingCompletedAt: completedAt,
        pageCount: 32,
        totalTokens: 12450,
      },
    });

    assert.equal(readyDoc.status, DocumentStatus.READY);
    assert.equal(readyDoc.pageCount, 32);
    assert.equal(readyDoc.totalTokens, 12450);
  });

  it('6. should share resources in study groups with explicit permissions', async () => {
    const studyGroup = await prisma.studyGroup.create({
      data: {
        ownerId: testUserId,
        courseId: testCourseId,
        name: 'Algo Knights Study Group',
        members: {
          create: {
            userId: testUserId,
            role: StudyGroupRole.ADMIN,
          },
        },
        resources: {
          create: {
            sharedById: testUserId,
            documentId: testDocumentId,
            permission: SharePermission.VIEW_ONLY,
          },
        },
      },
      include: {
        members: true,
        resources: true,
      },
    });

    assert.equal(studyGroup.resources.length, 1);
    assert.equal(studyGroup.resources[0].documentId, testDocumentId);
    assert.equal(studyGroup.resources[0].permission, SharePermission.VIEW_ONLY);

    await prisma.studyGroup.delete({ where: { id: studyGroup.id } });
  });

  it('7. should create a quiz and record a separate quiz attempt', async () => {
    const quiz = await prisma.quiz.create({
      data: {
        userId: testUserId,
        courseId: testCourseId,
        documentId: testDocumentId,
        title: 'Diagnostic Test: Big-O Complexity',
        difficulty: DifficultyLevel.INTERMEDIATE,
        questions: {
          create: {
            questionOrder: 1,
            questionType: QuestionType.MULTIPLE_CHOICE,
            prompt: 'What is the tight asymptotic bound of Binary Search?',
            expectedAnswer: 'O(log n)',
            explanation: 'Binary search halves the search space each step.',
            options: {
              create: [
                { optionOrder: 1, text: 'O(1)', isCorrect: false },
                { optionOrder: 2, text: 'O(log n)', isCorrect: true },
                { optionOrder: 3, text: 'O(n)', isCorrect: false },
                { optionOrder: 4, text: 'O(n^2)', isCorrect: false },
              ],
            },
          },
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    assert.ok(quiz.id);
    assert.equal(quiz.questions.length, 1);
    const question = quiz.questions[0];
    const correctOption = question.options.find((o) => o.isCorrect);
    assert.ok(correctOption);
    testQuizId = quiz.id;

    // Record separate QuizAttempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: testUserId,
        score: 100.0,
        totalQuestions: 1,
        correctAnswers: 1,
        isCompleted: true,
        completedAt: new Date(),
        answers: {
          create: {
            questionId: question.id,
            selectedOptionId: correctOption.id,
            submittedAnswer: correctOption.text,
            isCorrect: true,
            feedback: 'Perfect!',
          },
        },
      },
      include: {
        answers: true,
      },
    });

    assert.ok(attempt.id);
    assert.equal(attempt.quizId, quiz.id);
    assert.equal(attempt.score, 100.0);
    assert.equal(attempt.answers.length, 1);
    assert.equal(attempt.answers[0].isCorrect, true);

    // Verify Quiz can be queried with attempt history
    const quizWithAttempts = await prisma.quiz.findUnique({
      where: { id: quiz.id },
      include: { attempts: true },
    });
    assert.equal(quizWithAttempts?.attempts.length, 1);
  });

  it('8. should record topic mastery and chapter completion', async () => {
    const progress = await prisma.studentProgress.create({
      data: {
        userId: testUserId,
        courseId: testCourseId,
        documentId: testDocumentId,
        topicKey: 'binary-search-complexity',
        isCompleted: true,
        completedAt: new Date(),
        masteryScore: 0.92,
        retentionStrength: 0.88,
      },
    });

    assert.ok(progress.id);
    assert.equal(progress.topicKey, 'binary-search-complexity');
    assert.equal(progress.isCompleted, true);
    assert.equal(progress.masteryScore, 0.92);

    const retrieved = await prisma.studentProgress.findUnique({
      where: {
        userId_documentId_topicKey: {
          userId: testUserId,
          documentId: testDocumentId,
          topicKey: 'binary-search-complexity',
        },
      },
    });

    assert.ok(retrieved);
    assert.equal(retrieved.isCompleted, true);
  });

  it('9. should store vector embeddings and query similarity via pgvector', async () => {
    // Create section and chunks
    const section = await prisma.documentSection.create({
      data: {
        documentId: testDocumentId,
        title: 'Asymptotic Notation',
        chapterNumber: 2,
        pageNumber: 15,
      },
    });

    const chunk1 = await prisma.documentChunk.create({
      data: {
        documentId: testDocumentId,
        sectionId: section.id,
        chunkIndex: 0,
        content: 'Theta notation bounds a function from above and below within constant factors.',
        pageNumber: 15,
        chapter: 'Chapter 2',
        tokenCount: 20,
      },
    });

    const chunk2 = await prisma.documentChunk.create({
      data: {
        documentId: testDocumentId,
        sectionId: section.id,
        chunkIndex: 1,
        content: 'Big O notation gives an asymptotic upper bound on the growth of a function.',
        pageNumber: 16,
        chapter: 'Chapter 2',
        tokenCount: 20,
      },
    });

    testChunkId = chunk1.id;

    // Vector 1: Highly aligned with dimension 0
    const vec1 = new Array(768).fill(0);
    vec1[0] = 1.0;

    // Vector 2: Aligned with dimension 1
    const vec2 = new Array(768).fill(0);
    vec2[1] = 1.0;

    await storeChunkVector(prisma, chunk1.id, vec1, 'text-embedding-004');
    await storeChunkVector(prisma, chunk2.id, vec2, 'text-embedding-004');

    // Query with search vector aligned with Vector 1
    const queryVec = new Array(768).fill(0);
    queryVec[0] = 0.99;
    queryVec[1] = 0.05;

    const results = await searchSimilarChunks(prisma, {
      embedding: queryVec,
      limit: 2,
      documentIds: [testDocumentId],
    });

    assert.equal(results.length, 2);
    // Chunk 1 should be the most similar result
    assert.equal(results[0].chunkId, chunk1.id);
    assert.ok(results[0].similarity > 0.95);
    // Chunk 2 similarity should be significantly lower
    assert.ok(results[1].similarity < results[0].similarity);
  });

  it('10. should preserve referential integrity according to deletion rules', async () => {
    // Create a temporary document with section, chunk, and quiz to test deletion cascade
    const tempDoc = await prisma.document.create({
      data: {
        ownerId: testUserId,
        title: 'Temp Deletion Test Document',
        fileName: 'temp.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 100,
        storagePath: 'temp/temp.pdf',
        storageProvider: StorageProvider.LOCAL,
      },
    });

    const tempChunk = await prisma.documentChunk.create({
      data: {
        documentId: tempDoc.id,
        chunkIndex: 0,
        content: 'Temporary content for deletion test.',
        tokenCount: 10,
      },
    });

    // Create a learning material referencing tempDoc
    const tempMaterial = await prisma.learningMaterial.create({
      data: {
        userId: testUserId,
        documentId: tempDoc.id,
        type: MaterialType.SUMMARY,
        title: 'Material attached to temp doc',
        content: 'Preserved content',
      },
    });

    // Delete the document
    await prisma.document.delete({
      where: { id: tempDoc.id },
    });

    // Verify chunk is cascaded and deleted
    const chunkAfterDocDelete = await prisma.documentChunk.findUnique({
      where: { id: tempChunk.id },
    });
    assert.equal(chunkAfterDocDelete, null);

    // Verify learning material is PRESERVED, but documentId is set to NULL (onDelete: SetNull)
    const materialAfterDocDelete = await prisma.learningMaterial.findUnique({
      where: { id: tempMaterial.id },
    });
    assert.ok(materialAfterDocDelete);
    assert.equal(materialAfterDocDelete.documentId, null);
    assert.equal(materialAfterDocDelete.title, 'Material attached to temp doc');

    // Clean up temp material
    await prisma.learningMaterial.delete({
      where: { id: tempMaterial.id },
    });
  });
});
