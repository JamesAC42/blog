-- CreateTable
CREATE TABLE "QuizVote" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "voterHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizVote_quizId_idx" ON "QuizVote"("quizId");

-- CreateIndex
CREATE INDEX "QuizVote_optionId_idx" ON "QuizVote"("optionId");

-- CreateIndex
CREATE INDEX "QuizVote_voterHash_idx" ON "QuizVote"("voterHash");

-- AddForeignKey
ALTER TABLE "QuizVote" ADD CONSTRAINT "QuizVote_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizVote" ADD CONSTRAINT "QuizVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "QuizOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
