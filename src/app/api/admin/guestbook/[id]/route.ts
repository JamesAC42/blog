import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { getAuthCookieName, verifyAdminJwt } from "@/lib/auth";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const body = await request.json().catch(() => null);
  if (!body) return new NextResponse("Bad Request", { status: 400 });
  const { isApproved } = body as { isApproved?: boolean };
  if (typeof isApproved !== "boolean") return new NextResponse("Bad Request", { status: 400 });
  await prisma.guestbookEntry.update({ where: { id: params.id }, data: { isApproved } });
  revalidateTag("guestbook");
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const token = (request.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((c) => c.startsWith(`${getAuthCookieName()}=`))
    ?.split("=")?.[1];
  const payload = token ? await verifyAdminJwt(token).catch(() => null) : null;
  if (!payload) return new NextResponse("Unauthorized", { status: 401 });

  await prisma.guestbookEntry.delete({ where: { id: params.id } });
  revalidateTag("guestbook");
  return new NextResponse(null, { status: 204 });
}


