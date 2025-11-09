import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body) return new NextResponse("Bad Request", { status: 400 });
  const { options } = body as { options?: { label: string; sort?: number }[] };
  if (!Array.isArray(options)) return new NextResponse("Bad Request", { status: 400 });
  await prisma.$transaction([
    prisma.quizOption.deleteMany({ where: { quizId: id } }),
    prisma.quizOption.createMany({ data: options.map((o, i) => ({ quizId: id, label: o.label, sort: o.sort ?? i })), skipDuplicates: true }),
  ]);
  const created = await prisma.quizOption.findMany({ where: { quizId: id }, orderBy: { sort: "asc" } });
  revalidateTag("homepage");
  return NextResponse.json({ options: created });
}


