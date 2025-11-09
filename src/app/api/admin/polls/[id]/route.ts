import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body) return new NextResponse("Bad Request", { status: 400 });
  const { question, activeFrom, activeTo } = body as { question?: string; activeFrom?: string; activeTo?: string | null };
  await prisma.poll.update({ where: { id }, data: { question, activeFrom: activeFrom ? new Date(activeFrom) : undefined, activeTo: activeTo === null ? null : activeTo ? new Date(activeTo) : undefined } });
  revalidateTag("polls");
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await prisma.poll.delete({ where: { id } });
  revalidateTag("polls");
  return new NextResponse(null, { status: 204 });
}


