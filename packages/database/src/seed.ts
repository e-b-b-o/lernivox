import { prisma } from './index.js';
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
import { storeChunkVector } from './vector.js';

/**
 * Deterministic database seeder for development and local testing.
 * Does not create real credentials or sensitive production data.
 */
export async function seedDatabase() {
  console.log('🌱 Starting deterministic database seed for Lernivox...');

  // 1. Create or upsert test user
  const user = await prisma.user.upsert({
    where: { email: 'alex.mercer@lernivox.test' },
    update: {},
    create: {
      email: 'alex.mercer@lernivox.test',
      name: 'Alex Mercer',
      role: Role.USER,
      planTier: PlanTier.PRO,
      identities: {
        create: {
          provider: AuthProvider.EMAIL_PASSWORD,
          providerAccountId: 'alex.mercer@lernivox.test',
          passwordHash: '$2b$12$dummyhashfordevelopmenttestingonly00000000000000000',
        },
      },
      preferences: {
        create: {
          difficulty: DifficultyLevel.INTERMEDIATE,
          explanationLength: ExplanationLength.BALANCED,
          teachingStyle: TeachingStyle.SOCRATIC,
          dailyStudyTargetMinutes: 45,
          theme: ThemePreference.SYSTEM,
        },
      },
    },
  });

  console.log(`👤 User ready: ${user.name} (${user.email})`);

  // 2. Create Course
  const course = await prisma.course.create({
    data: {
      ownerId: user.id,
      name: 'Introduction to Algorithms & Data Structures',
      code: 'CS-101',
      description: 'Foundational computing concepts, asymptotic complexity, and graph algorithms.',
      color: '#3B82F6',
      members: {
        create: {
          userId: user.id,
          role: CourseMemberRole.OWNER,
        },
      },
    },
  });

  console.log(`📚 Course created: ${course.name} (${course.code})`);

  // 3. Central Document Library & Persistent Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Introduction to Algorithms (Excerpts)',
      type: 'PERSONAL',
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: 'OWNER',
        },
      },
    },
  });

  const document = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      ownerId: user.id,
      title: 'Introduction to Algorithms (Excerpts)',
      fileName: 'algorithms_excerpts.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 8420000,
      storagePath: 'documents/alex/algorithms_excerpts.pdf',
      storageProvider: StorageProvider.LOCAL,
      visibility: DocumentVisibility.PRIVATE,
      status: DocumentStatus.READY,
      pageCount: 45,
      totalTokens: 18500,
      processingStartedAt: new Date(Date.now() - 60000),
      processingCompletedAt: new Date(),
    },
  });

  // 4. Link Document to Course (Many-to-Many without file duplication)
  await prisma.courseDocument.create({
    data: {
      courseId: course.id,
      documentId: document.id,
      addedById: user.id,
    },
  });

  console.log(`📄 Document created & associated with course: ${document.title}`);

  // 5. Document Sections and Chunks
  const section = await prisma.documentSection.create({
    data: {
      documentId: document.id,
      title: 'Chapter 1: The Role of Algorithms in Computing',
      chapterNumber: 1,
      pageNumber: 5,
    },
  });

  const chunk = await prisma.documentChunk.create({
    data: {
      documentId: document.id,
      sectionId: section.id,
      chunkIndex: 0,
      content:
        'An algorithm is any well-defined computational procedure that takes some value, or set of values, as input and produces some value, or set of values, as output. An algorithm is thus a sequence of computational steps that transform the input into the output.',
      pageNumber: 5,
      chapter: 'Chapter 1',
      sectionTitle: 'Algorithms as a Technology',
      tokenCount: 48,
    },
  });

  // 6. Vector Embedding for Chunk (Deterministic 768-dim mock vector)
  const mockEmbedding = new Array(768).fill(0).map((_, i) => (i === 0 ? 1.0 : 0.001 * (i % 10)));
  await storeChunkVector(prisma, chunk.id, mockEmbedding, 'text-embedding-004');
  console.log(`🔢 Vector embedding (768-dim) stored for chunk ${chunk.id}`);

  // 7. Generated Study Material & Flashcards
  const material = await prisma.learningMaterial.create({
    data: {
      userId: user.id,
      courseId: course.id,
      documentId: document.id,
      type: MaterialType.SUMMARY,
      title: 'Chapter 1 Key Takeaways',
      content:
        'Algorithms are core computing procedures evaluated by efficiency, correctness, and resource consumption.',
      citations: {
        create: {
          documentId: document.id,
          chunkId: chunk.id,
          quoteSnippet:
            'An algorithm is any well-defined computational procedure that takes some value as input and produces some value as output.',
          pageNumber: 5,
        },
      },
      flashcards: {
        create: {
          front: 'What is the formal definition of an algorithm?',
          back: 'A well-defined computational procedure that transforms input values into output values.',
          repetitionLevel: 1,
          easeFactor: 2.5,
          intervalDays: 1,
          nextReviewAt: new Date(Date.now() + 86400000),
        },
      },
    },
  });

  console.log(`📝 Learning material & flashcard created: ${material.title}`);

  // 8. Quiz & Question Definition
  const quiz = await prisma.quiz.create({
    data: {
      userId: user.id,
      courseId: course.id,
      documentId: document.id,
      title: 'Algorithms Chapter 1 Diagnostic',
      difficulty: DifficultyLevel.INTERMEDIATE,
      questions: {
        create: {
          questionOrder: 1,
          questionType: QuestionType.MULTIPLE_CHOICE,
          prompt: 'Which phrase best defines a computational algorithm?',
          expectedAnswer: 'A sequence of computational steps transforming inputs into outputs.',
          explanation: 'Referenced from Chapter 1 page 5.',
          sourceChunkId: chunk.id,
          options: {
            create: [
              { optionOrder: 1, text: 'A random collection of variables.', isCorrect: false },
              {
                optionOrder: 2,
                text: 'A sequence of computational steps transforming inputs into outputs.',
                isCorrect: true,
              },
              { optionOrder: 3, text: 'A hardware component in memory.', isCorrect: false },
              { optionOrder: 4, text: 'An operating system kernel loop.', isCorrect: false },
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

  // 9. Separate Quiz Attempt
  const question = quiz.questions[0];
  if (!question) {
    throw new Error('Expected quiz to have at least one question');
  }
  const correctOption = question.options.find((o) => o.isCorrect);
  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId: user.id,
      score: 100.0,
      totalQuestions: 1,
      correctAnswers: 1,
      isCompleted: true,
      completedAt: new Date(),
      answers: {
        create: {
          questionId: question.id,
          selectedOptionId: correctOption?.id,
          submittedAnswer: correctOption?.text,
          isCorrect: true,
          feedback: 'Accurate concept understanding.',
        },
      },
    },
  });

  console.log(`🎯 Quiz (${quiz.title}) and separate attempt (${attempt.id}) created`);

  // 10. Student Topic Progress
  await prisma.studentProgress.create({
    data: {
      userId: user.id,
      courseId: course.id,
      documentId: document.id,
      sectionId: section.id,
      topicKey: 'algorithms-computational-definition',
      isCompleted: true,
      completedAt: new Date(),
      masteryScore: 0.95,
      retentionStrength: 0.9,
    },
  });

  // 11. Study Plan & Scheduled Items
  await prisma.studyPlan.create({
    data: {
      userId: user.id,
      courseId: course.id,
      title: 'CS-101 Midterm Master Schedule',
      targetExamDate: new Date(Date.now() + 21 * 86400000),
      scheduleItems: {
        create: {
          title: 'Review Chapter 1 & Practice Quiz',
          scheduledDate: new Date(Date.now() + 86400000),
          sectionId: section.id,
          topicKey: 'algorithms-computational-definition',
        },
      },
    },
  });

  // 12. Study Group & Shared Resources
  const group = await prisma.studyGroup.create({
    data: {
      ownerId: user.id,
      courseId: course.id,
      name: 'CS-101 Peer Study Circle',
      description: 'Collaborative problem solving and weekly practice quizzes.',
      members: {
        create: {
          userId: user.id,
          role: StudyGroupRole.ADMIN,
        },
      },
      resources: {
        create: {
          sharedById: user.id,
          quizId: quiz.id,
          permission: SharePermission.VIEW_ONLY,
        },
      },
    },
  });

  console.log(`👥 Study group created: ${group.name} with shared quiz resource.`);
  console.log('✅ Seed completed successfully!');
}

if (process.argv[1] && (process.argv[1].endsWith('seed.js') || process.argv[1].endsWith('seed.ts'))) {
  seedDatabase()
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
