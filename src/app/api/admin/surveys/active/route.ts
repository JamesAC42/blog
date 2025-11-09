import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return new NextResponse("Bad Request", { status: 400 });
  const { surveyId } = body as { surveyId?: string };
  if (!surveyId) return new NextResponse("Bad Request", { status: 400 });
  await prisma.$transaction([
    prisma.survey.updateMany({ data: { active: false } }),
    prisma.survey.update({ where: { id: surveyId }, data: { active: true } }),
  ]);
  revalidateTag("homepage");
  return new NextResponse(null, { status: 204 });
}


