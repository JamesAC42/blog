import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const poll = await prisma.poll.findFirst({
    where: {
      OR: [
        { AND: [{ activeFrom: { lte: now } }, { activeTo: null }] },
        { AND: [{ activeFrom: { lte: now } }, { activeTo: { gte: now } }] },
      ],
    },
    orderBy: { activeFrom: "desc" },
    include: { options: true },
  });
  const pollCounts = poll
    ? await prisma.pollVote.groupBy({ by: ["optionId"], where: { pollId: poll.id }, _count: { _all: true } })
    : [];

  const quiz = await prisma.quiz.findFirst({ where: { active: true }, include: { options: true } });
  const quizCounts = quiz
    ? await prisma.quizVote.groupBy({ by: ["optionId"], where: { quizId: quiz.id }, _count: { _all: true } })
    : [];

  const survey = await prisma.survey.findFirst({ where: { active: true }, include: { options: true } });
  const surveyCounts = survey
    ? await prisma.surveyVote.groupBy({ by: ["optionId"], where: { surveyId: survey.id }, _count: { _all: true } })
    : [];

  return NextResponse.json({
    poll: poll && { id: poll.id, question: poll.question, options: poll.options.map(o => ({ id: o.id, label: o.label, count: pollCounts.find(c => c.optionId === o.id)?._count._all ?? 0 })) },
    quiz: quiz && { id: quiz.id, question: quiz.question, options: quiz.options.map(o => ({ id: o.id, label: o.label, count: quizCounts.find(c => c.optionId === o.id)?._count._all ?? 0 })) },
    survey: survey && { id: survey.id, question: survey.question, options: survey.options.map(o => ({ id: o.id, label: o.label, count: surveyCounts.find(c => c.optionId === o.id)?._count._all ?? 0 })) },
  });
}


