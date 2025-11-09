import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return new NextResponse("Bad Request", { status: 400 });
  const { question, options, active } = body as { question?: string; options?: { label: string }[]; active?: boolean };
  if (!question || !Array.isArray(options) || options.length === 0) return new NextResponse("Bad Request", { status: 400 });
  const survey = await prisma.survey.create({ data: { question, active: !!active } });
  for (let i = 0; i < options.length; i++) {
    await prisma.surveyOption.create({ data: { surveyId: survey.id, label: options[i].label, sort: i } });
  }
  if (active) {
    await prisma.survey.updateMany({ data: { active: false }, where: { NOT: { id: survey.id } } });
  }
  revalidateTag("homepage");
  return NextResponse.json({ id: survey.id });
}


