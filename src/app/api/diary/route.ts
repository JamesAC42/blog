import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

function normalizePreview(content: string, limit = 280): string {
  const trimmed = content.trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }
  return trimmed.slice(0, limit).trimEnd() + '...';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { page, pageSize } = parsed.data;
  const where = { status: "PUBLISHED" as const };
  const [entries, total] = await Promise.all([
    prisma.diaryEntry.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.diaryEntry.count({ where }),
  ]);

  const items = entries.map((entry) => {
    const published = entry.publishedAt ?? entry.createdAt;
    return {
      id: entry.id,
      slug: entry.slug,
      title: entry.title,
      publishedAt: published ? published.toISOString() : null,
      preview: normalizePreview(entry.content),
    };
  });

  return NextResponse.json({ page, pageSize, total, items });
}

