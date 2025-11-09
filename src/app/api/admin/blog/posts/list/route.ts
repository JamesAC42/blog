import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 20)));
  const skip = (page - 1) * pageSize;
  const search = (url.searchParams.get("search") ?? "").trim();

  const where: NonNullable<Parameters<typeof prisma.blogPost.findMany>[0]>["where"] = search
    ? {
        OR: [
          { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { slug: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { excerpt: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {};

  const [total, items] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        tags: true,
        coverImage: true,
        status: true,
        isFeatured: true,
        publishedAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, items });
}


