import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const quiz = await prisma.quiz.findFirst({ where: { active: true }, include: { options: { orderBy: { sort: "asc" } } } });
  if (!quiz) return new NextResponse("Not Found", { status: 404 });
  return NextResponse.json({
    id: quiz.id,
    question: quiz.question,
    options: quiz.options.map((o) => ({ id: o.id, label: o.label })),
    correctOptionId: quiz.correctOptionId ?? "",
  });
}


