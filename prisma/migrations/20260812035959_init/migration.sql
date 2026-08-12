-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subTopic" TEXT,
    "probabilityTier" TEXT,
    "level" TEXT,
    "infraVsDev" TEXT,
    "scope" TEXT,
    "reviewBeforeInterview" BOOLEAN NOT NULL DEFAULT false,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "sourceSheet" TEXT NOT NULL,
    "noReviewNeeded" BOOLEAN NOT NULL DEFAULT false,
    "timesPracticed" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeAttempt" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "aiFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_topic_idx" ON "Question"("topic");

-- CreateIndex
CREATE INDEX "Question_subTopic_idx" ON "Question"("subTopic");

-- CreateIndex
CREATE INDEX "Question_probabilityTier_idx" ON "Question"("probabilityTier");

-- CreateIndex
CREATE INDEX "Question_noReviewNeeded_idx" ON "Question"("noReviewNeeded");

-- CreateIndex
CREATE INDEX "PracticeAttempt_questionId_idx" ON "PracticeAttempt"("questionId");

-- AddForeignKey
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
