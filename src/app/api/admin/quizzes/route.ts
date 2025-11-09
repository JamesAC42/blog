import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return new NextResponse("Bad Request", { status: 400 });
  const { question, options, correctIndex, active } = body as { question?: string; options?: { label: string }[]; correctIndex?: number; active?: boolean };
  if (!question || !Array.isArray(options) || options.length === 0) return new NextResponse("Bad Request", { status: 400 });
  const quiz = await prisma.quiz.create({ data: { question, active: !!active } });
  const created = [] as string[];
  for (let i = 0; i < options.length; i++) {
    const opt = await prisma.quizOption.create({ data: { quizId: quiz.id, label: options[i].label, sort: i } });
    created.push(opt.id);
  }
  if (typeof correctIndex === "number" && created[correctIndex]) {
    await prisma.quiz.update({ where: { id: quiz.id }, data: { correctOptionId: created[correctIndex] } });
  }
  if (active) {
    await prisma.quiz.updateMany({ data: { active: false }, where: { NOT: { id: quiz.id } } });
  }
  revalidateTag("homepage");
  return NextResponse.json({ id: quiz.id });
}


