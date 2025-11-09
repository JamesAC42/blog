import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { slug?: string } | null;
    const slug = body?.slug?.trim();
    if (!slug) return new NextResponse("Bad Request", { status: 400 });
    const updated = await prisma.blogPost.update({ where: { slug }, data: { views: { increment: 1 } }, select: { views: true } }).catch(() => null);
    if (!updated) return new NextResponse("Not Found", { status: 404 });
    return NextResponse.json({ views: updated.views });
  } catch {
    return new NextResponse("Server Error", { status: 500 });
  }
}


