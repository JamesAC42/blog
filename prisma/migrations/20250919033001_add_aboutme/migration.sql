-- CreateTable
CREATE TABLE "AboutMe" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "markdownPath" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutMe_pkey" PRIMARY KEY ("id")
);
