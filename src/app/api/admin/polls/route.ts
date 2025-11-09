import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return new NextResponse("Bad Request", { status: 400 });
  const { question, options, activeFrom, activeTo } = body as { question?: string; options?: { label: string }[]; activeFrom?: string; activeTo?: string | null };
  if (!question) return new NextResponse("Bad Request", { status: 400 });
  const poll = await prisma.poll.create({ data: { question, activeFrom: activeFrom ? new Date(activeFrom) : new Date(), activeTo: activeTo ? new Date(activeTo) : null } });
  if (Array.isArray(options)) {
    for (let i = 0; i < options.length; i++) {
      await prisma.pollOption.create({ data: { pollId: poll.id, label: options[i].label, sort: i } });
    }
  }
  revalidateTag("polls");
  return NextResponse.json({ id: poll.id });
}


