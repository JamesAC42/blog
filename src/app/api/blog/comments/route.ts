import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { verifyTurnstile, getAuthCookieName, verifyAdminJwt } from "@/lib/auth";

const MAX_NAME = 64;
const MAX_EMAIL = 200;
const MAX_CONTENT = 2000;

const createSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1).max(MAX_NAME),
  email: z.string().email().max(MAX_EMAIL).optional().or(z.literal("")),
  content: z.string().min(1).max(MAX_CONTENT),
  parentId: z.string().uuid().optional(),
  turnstileToken: z.string().min(1),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return new NextResponse("Bad Request", { status: 400 });
  const post = await prisma.blogPost.findFirst({ where: { slug }, select: { id: true } });
  if (!post) return new NextResponse("Not Found", { status: 404 });
  const items = await prisma.comment.findMany({
    where: { postId: post.id, parentId: null, isDeleted: false },
    orderBy: { createdAt: "asc" },
    include: { replies: { where: { isDeleted: false }, orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  // Determine admin from cookie
  const token = (request.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((c) => c.startsWith(`${getAuthCookieName()}=`))
    ?.split("=")?.[1];
  const payload = token ? await verifyAdminJwt(token) : null;
  const isAdmin = !!payload;

  // Require and verify Turnstile for non-admin submissions
  if (!isAdmin) {
    const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0] || undefined;
    const captchaOk = await verifyTurnstile(data.turnstileToken, ip);
    if (!captchaOk) return NextResponse.json({ error: "captcha" }, { status: 400 });
  }

  const post = await prisma.blogPost.findFirst({ where: { slug: data.slug }, select: { id: true } });
  if (!post) return new NextResponse("Not Found", { status: 404 });

  // Only admin can reply to comments (parentId present)
  if (data.parentId && !isAdmin) return new NextResponse("Unauthorized", { status: 401 });

  const created = await prisma.comment.create({
    data: {
      postId: post.id,
      parentId: data.parentId ?? null,
      name: data.name,
      email: data.email ? data.email : null,
      content: data.content,
      isAdmin: isAdmin,
    },
  });
  return NextResponse.json(created);
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null) as { id?: string; content?: string } | null;
  if (!body?.id || !body?.content) return new NextResponse("Bad Request", { status: 400 });
  if (body.content.length > MAX_CONTENT) return new NextResponse("Bad Request", { status: 400 });

  const token = (request.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((c) => c.startsWith(`${getAuthCookieName()}=`))
    ?.split("=")?.[1];
  const payload = token ? await verifyAdminJwt(token) : null;
  if (!payload) return new NextResponse("Unauthorized", { status: 401 });

  const updated = await prisma.comment.update({ where: { id: body.id }, data: { content: body.content } });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return new NextResponse("Bad Request", { status: 400 });

  const token = (request.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((c) => c.startsWith(`${getAuthCookieName()}=`))
    ?.split("=")?.[1];
  const payload = token ? await verifyAdminJwt(token) : null;
  if (!payload) return new NextResponse("Unauthorized", { status: 401 });

  await prisma.comment.update({ where: { id }, data: { isDeleted: true, content: "" } });
  return NextResponse.json({ ok: true });
}


