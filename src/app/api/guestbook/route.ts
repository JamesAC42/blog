import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile, getAuthCookieName, verifyAdminJwt } from "@/lib/auth";
import { z } from "zod";
import { computeVoterHash, getClientIp } from "@/lib/vote";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") || 20)));
  const skip = (page - 1) * pageSize;

  const token = (request.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((c) => c.startsWith(`${getAuthCookieName()}=`))
    ?.split("=")?.[1];
  const payload = token ? await verifyAdminJwt(token) : null;
  const isAdmin = !!payload;

  // Use raw queries to avoid type mismatches before prisma generate
  let topRows: Array<{ id: string; name: string; message: string; createdAt: Date; email: string | null; isAdmin: boolean }> = [];
  topRows = await prisma.$queryRaw<Array<{ id: string; name: string; message: string; createdAt: Date; email: string | null; isAdmin: boolean }>>(Prisma.sql`
    SELECT "id","name","message","createdAt","email","isAdmin"
    FROM "GuestbookEntry"
    WHERE "parentId" IS NULL
    ORDER BY "createdAt" DESC
    LIMIT ${pageSize} OFFSET ${skip}
  `);
  const parentIds = topRows.map((r) => r.id);
  let replyRows: Array<{ id: string; parentId: string; name: string; message: string; createdAt: Date; email: string | null; isAdmin: boolean }> = [];
  if (parentIds.length > 0) {
    // parameterize IN clause safely by building VALUES list
    replyRows = await prisma.$queryRaw<Array<{ id: string; parentId: string; name: string; message: string; createdAt: Date; email: string | null; isAdmin: boolean }>>(Prisma.sql`
      SELECT "id","parentId","name","message","createdAt","email","isAdmin"
      FROM "GuestbookEntry"
      WHERE "parentId" IN (${Prisma.join(parentIds)})
      ORDER BY "createdAt" ASC
    `);
  }
  const parentIdToReplies = new Map<string, Array<{ id: string; name: string; message: string; createdAt: Date; email: string | null; isAdmin: boolean }>>();
  for (const r of replyRows) {
    const arr = parentIdToReplies.get(r.parentId) ?? [];
    arr.push({ id: r.id, name: r.name, message: r.message, createdAt: r.createdAt, email: r.email, isAdmin: r.isAdmin });
    parentIdToReplies.set(r.parentId, arr);
  }
  const items = topRows.map((it) => ({
    id: it.id,
    name: it.isAdmin ? "Admin" : it.name,
    message: it.message,
    createdAt: it.createdAt,
    isAdmin: it.isAdmin,
    email: isAdmin ? it.email : undefined,
    replies: (parentIdToReplies.get(it.id) ?? []).map((r) => ({
      id: r.id,
      name: r.isAdmin ? "Admin" : r.name,
      message: r.message,
      createdAt: r.createdAt,
      isAdmin: r.isAdmin,
      email: isAdmin ? r.email : undefined,
    })),
  }));
  const res = NextResponse.json({ items, page, pageSize, isAdmin });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.headers.set("Pragma", "no-cache");
  return res;
}

const MAX_NAME = 64;
const MAX_EMAIL = 200;
const MAX_MESSAGE = 2000;

const createSchema = z.object({
  name: z.string().min(1).max(MAX_NAME),
  message: z.string().min(1).max(MAX_MESSAGE),
  email: z.string().email().max(MAX_EMAIL).optional().or(z.literal("")),
  parentId: z.string().uuid().optional(),
  turnstileToken: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const token = (request.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((c) => c.startsWith(`${getAuthCookieName()}=`))
    ?.split("=")?.[1];
  const payload = token ? await verifyAdminJwt(token) : null;
  const isAdmin = !!payload;

  // Require captcha for non-admin submissions
  if (!isAdmin) {
    const ip = getClientIp(new Headers(request.headers));
    const captchaOk = await verifyTurnstile(data.turnstileToken, ip);
    if (!captchaOk) return NextResponse.json({ error: "captcha" }, { status: 400 });
  }

  // Only admin can reply (parentId present)
  if (data.parentId && !isAdmin) return new NextResponse("Unauthorized", { status: 401 });

  // Rate limit: at most 1 message per 60 seconds per viewer hash
  const headers = new Headers(request.headers);
  const ip = getClientIp(headers);
  const ua = headers.get("user-agent");
  const viewerHash = computeVoterHash(ip, ua);
  const rlKey = `guestbook:rl:${viewerHash}`;
  const last = await prisma.settingsKV.findUnique({ where: { key: rlKey } }).catch(() => null);
  const now = Date.now();
  const lastVal = (last?.value as unknown) as { t?: number } | undefined;
  if (!isAdmin && lastVal?.t && now - lastVal.t < 60_000) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const newId = randomUUID();
  const createdRows = await prisma.$queryRaw<Array<{ id: string; name: string; message: string; email: string | null; isApproved: boolean; createdAt: Date; isAdmin: boolean; parentId: string | null }>>(Prisma.sql`
    INSERT INTO "GuestbookEntry" ("id","name","message","email","isApproved","ipHash","parentId","isAdmin")
    VALUES (${newId}, ${data.name}, ${data.message}, ${data.email ? data.email : null}, ${true}, ${viewerHash}, ${data.parentId ?? null}, ${isAdmin})
    RETURNING "id","name","message","email","isApproved","createdAt","isAdmin","parentId"
  `);
  const created = createdRows[0];

  if (!isAdmin) {
    await prisma.settingsKV.upsert({
      where: { key: rlKey },
      create: { key: rlKey, value: { t: now } },
      update: { value: { t: now } },
    });
  }

  return NextResponse.json(created);
}


