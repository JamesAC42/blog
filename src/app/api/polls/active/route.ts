import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const poll = await prisma.poll.findFirst({
    where: {
      OR: [
        { AND: [{ activeFrom: { lte: now } }, { activeTo: null }] },
        { AND: [{ activeFrom: { lte: now } }, { activeTo: { gte: now } }] },
      ],
    },
    orderBy: { activeFrom: "desc" },
    include: { options: { orderBy: { sort: "asc" } } },
  });
  if (!poll) return new NextResponse("Not Found", { status: 404 });
  return NextResponse.json({ id: poll.id, question: poll.question, options: poll.options.map((o) => ({ id: o.id, label: o.label })) });
}


