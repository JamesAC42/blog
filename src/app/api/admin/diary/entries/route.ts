import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  content: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  publishedAt: z.string().optional(),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function findUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(base);
  const fallback = baseSlug || String(Date.now());
  let candidate = fallback;
  let counter = 1;
  while (true) {
    const existing = await prisma.diaryEntry.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
    counter += 1;
    candidate = `${fallback}-${counter}`;
  }
}

function parseDate(input?: string | null): Date | null {
  if (!input) {
    return null;
  }
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const slug = await findUniqueSlug(data.slug && data.slug.length ? data.slug : data.title);
  const publishedAt = data.status === "PUBLISHED" ? parseDate(data.publishedAt) ?? new Date() : null;

  const created = await prisma.diaryEntry.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      status: data.status,
      publishedAt,
    },
  });

  return NextResponse.json(created);
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  if (!data.id) {
    return new NextResponse("Missing id", { status: 400 });
  }

  const existing = await prisma.diaryEntry.findUnique({ where: { id: data.id } });
  if (!existing) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const desiredSlug = data.slug && data.slug.length ? data.slug : slugify(data.title);
  const slug = desiredSlug === existing.slug ? existing.slug : await findUniqueSlug(desiredSlug, existing.id);
  const nextPublishedAt = data.status === "PUBLISHED"
    ? parseDate(data.publishedAt) ?? existing.publishedAt ?? new Date()
    : null;

  const updated = await prisma.diaryEntry.update({
    where: { id: existing.id },
    data: {
      title: data.title,
      slug,
      content: data.content,
      status: data.status,
      publishedAt: nextPublishedAt,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return new NextResponse("Missing id", { status: 400 });
  }

  await prisma.diaryEntry.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return new NextResponse("Missing id", { status: 400 });
  }

  const entry = await prisma.diaryEntry.findUnique({ where: { id } });
  if (!entry) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.json(entry);
}
