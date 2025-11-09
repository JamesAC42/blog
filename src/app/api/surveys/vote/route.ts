import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeVoterHash, getClientIp } from "@/lib/vote";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return new NextResponse("Bad Request", { status: 400 });
  const { optionId } = body as { optionId?: string };
  if (!optionId) return new NextResponse("Bad Request", { status: 400 });

  const option = await prisma.surveyOption.findUnique({ where: { id: optionId } });
  if (!option) return new NextResponse("Not Found", { status: 404 });

  const headers = new Headers(request.headers);
  const ip = getClientIp(headers);
  const ua = headers.get("user-agent");
  const voterHash = computeVoterHash(ip, ua);

  // Prevent duplicate votes by same hash per survey
  const existing = await prisma.surveyVote.findFirst({ where: { surveyId: option.surveyId, voterHash } });
  if (existing) return new NextResponse("Already voted", { status: 429 });

  await prisma.surveyVote.create({ data: { surveyId: option.surveyId, optionId: option.id, voterHash } });
  return NextResponse.json({ ok: true });
}


