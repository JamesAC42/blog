import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return new NextResponse("Bad Request", { status: 400 });
  const { quizId } = body as { quizId?: string };
  if (!quizId) return new NextResponse("Bad Request", { status: 400 });
  await prisma.$transaction([
    prisma.quiz.updateMany({ data: { active: false } }),
    prisma.quiz.update({ where: { id: quizId }, data: { active: true } }),
  ]);
  revalidateTag("homepage");
  return new NextResponse(null, { status: 204 });
}


