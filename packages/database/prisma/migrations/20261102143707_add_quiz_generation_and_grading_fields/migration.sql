-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('GENERATING', 'READY', 'FAILED');

-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'FILL_IN_THE_BLANK';

-- AlterTable
ALTER TABLE "quiz_attempt_answers" ADD COLUMN     "isPartial" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "quiz_questions" ADD COLUMN     "pageNumber" INTEGER,
ADD COLUMN     "rubric" TEXT,
ADD COLUMN     "sourceExcerpt" TEXT;

-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "sourceChapter" TEXT,
ADD COLUMN     "status" "QuizStatus" NOT NULL DEFAULT 'READY';

-- CreateIndex
CREATE INDEX "quizzes_status_idx" ON "quizzes"("status");
