import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await context.params;
  const slug = decodeURIComponent(rawSlug);
  if (!slug) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const entry = await prisma.diaryEntry.findFirst({
    where: { slug, status: "PUBLISHED" },
  });

  if (!entry) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.json({
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    content: entry.content,
    status: entry.status,
    publishedAt: entry.publishedAt ? entry.publishedAt.toISOString() : null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  });
}
