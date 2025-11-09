import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";

const RootContentDir = path.join(process.cwd(), "content", "blog");

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  coverImage: z.string().url().optional(),
  markdown: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  isFeatured: z.boolean().optional(),
  // accept date-only or datetime strings; we will new Date() them later
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
  if (!baseSlug) return String(Date.now());
  let candidate = baseSlug;
  let i = 1;
  while (true) {
    const exists = await prisma.blogPost.findFirst({ where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } });
    if (!exists) return candidate;
    i += 1;
    candidate = `${baseSlug}-${i}`;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  await fs.mkdir(RootContentDir, { recursive: true });
  const slug = data.slug && data.slug.length ? await findUniqueSlug(data.slug) : await findUniqueSlug(data.title);
  const fileName = `${slug}.md`;
  const filePath = path.join(RootContentDir, fileName);
  await fs.writeFile(filePath, data.markdown, "utf8");

  const created = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt ?? null,
      tags: data.tags,
      coverImage: data.coverImage ?? null,
      markdownPath: path.relative(process.cwd(), filePath),
      status: data.status,
      isFeatured: data.isFeatured ?? false,
      publishedAt: data.status === "PUBLISHED" ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : null,
    },
  });

  return NextResponse.json(created);
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  if (!data.id) return new NextResponse("Missing id", { status: 400 });

  const existing = await prisma.blogPost.findUnique({ where: { id: data.id } });
  if (!existing) return new NextResponse("Not Found", { status: 404 });

  // If slug changed, rename file
  const currentAbsPath = path.isAbsolute(existing.markdownPath)
    ? existing.markdownPath
    : path.join(process.cwd(), existing.markdownPath);
  const desiredSlug = data.slug && data.slug.length ? data.slug : slugify(data.title);
  const uniqueSlug = desiredSlug === existing.slug ? existing.slug : await findUniqueSlug(desiredSlug, existing.id);
  const newFileName = `${uniqueSlug}.md`;
  const newAbsPath = path.join(RootContentDir, newFileName);
  await fs.mkdir(RootContentDir, { recursive: true });
  if (existing.slug !== uniqueSlug) {
    try {
      await fs.rename(currentAbsPath, newAbsPath);
    } catch {
      // fallback to write new file
      await fs.writeFile(newAbsPath, data.markdown, "utf8");
    }
  }
  // Write updated markdown
  await fs.writeFile(newAbsPath, data.markdown, "utf8");

  const updated = await prisma.blogPost.update({
    where: { id: data.id },
    data: {
      title: data.title,
      slug: uniqueSlug,
      excerpt: data.excerpt ?? null,
      tags: data.tags,
      coverImage: data.coverImage ?? null,
      markdownPath: path.relative(process.cwd(), newAbsPath),
      status: data.status,
      isFeatured: data.isFeatured ?? false,
      publishedAt:
        data.status === "PUBLISHED"
          ? data.publishedAt
            ? new Date(data.publishedAt)
            : existing.publishedAt ?? new Date()
          : null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return new NextResponse("Not Found", { status: 404 });

  const absPath = path.isAbsolute(post.markdownPath) ? post.markdownPath : path.join(process.cwd(), post.markdownPath);
  try {
    await fs.unlink(absPath);
  } catch {
    // ignore
  }

  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return new NextResponse("Not Found", { status: 404 });
  const absPath = path.isAbsolute(post.markdownPath) ? post.markdownPath : path.join(process.cwd(), post.markdownPath);
  let markdown = "";
  try {
    markdown = await fs.readFile(absPath, "utf8");
  } catch {
    markdown = "";
  }
  return NextResponse.json({ ...post, markdown });
}


