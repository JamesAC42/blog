import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body) return new NextResponse("Bad Request", { status: 400 });
  const { options } = body as { options?: { id?: string; label: string; sort?: number }[] };
  if (!Array.isArray(options)) return new NextResponse("Bad Request", { status: 400 });

  await prisma.$transaction([
    prisma.pollOption.deleteMany({ where: { pollId: id } }),
    prisma.pollOption.createMany({
      data: options.map((o, i) => ({ pollId: id, label: o.label, sort: o.sort ?? i })),
      skipDuplicates: true,
    }),
  ]);
  revalidateTag("polls");
  return new NextResponse(null, { status: 204 });
}


