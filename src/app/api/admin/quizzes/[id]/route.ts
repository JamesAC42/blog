import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body) return new NextResponse("Bad Request", { status: 400 });
  const { question, correctOptionId, active } = body as { question?: string; correctOptionId?: string; active?: boolean };
  await prisma.quiz.update({ where: { id }, data: { question, correctOptionId, active } });
  revalidateTag("homepage");
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await prisma.quiz.delete({ where: { id } });
  revalidateTag("homepage");
  return new NextResponse(null, { status: 204 });
}


