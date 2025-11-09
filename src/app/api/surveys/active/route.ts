import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SurveyOption = { id: string; label: string };

export async function GET() {
  const survey = await prisma.survey.findFirst({ where: { active: true }, include: { options: { orderBy: { sort: "asc" } } } });
  if (!survey) return new NextResponse("Not Found", { status: 404 });
  return NextResponse.json({
    id: survey.id,
    question: survey.question,
    choices: survey.options.map((o: SurveyOption) => ({ id: o.id, label: o.label })),
  });
}


