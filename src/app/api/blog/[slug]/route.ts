import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      tags: true,
      coverImage: true,
      publishedAt: true,
      markdownPath: true,
      isFeatured: true,
      views: true,
      likes: true,
    },
  });
  if (!post) return new NextResponse("Not Found", { status: 404 });

  // Read markdown from disk; path is stored relative to project root for safety
  const absolutePath = path.isAbsolute(post.markdownPath)
    ? post.markdownPath
    : path.join(process.cwd(), post.markdownPath);
  let markdown = "";
  try {
    markdown = await fs.readFile(absolutePath, "utf8");
  } catch {
    markdown = "";
  }

  return NextResponse.json({ ...post, markdown });
}


