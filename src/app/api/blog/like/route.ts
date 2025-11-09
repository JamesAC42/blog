import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeVoterHash, getClientIp } from "@/lib/vote";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { slug?: string } | null;
    const slug = body?.slug?.trim();
    if (!slug) return new NextResponse("Bad Request", { status: 400 });

    // Compute a per-viewer hash using IP and UA
    const headers = new Headers(request.headers);
    const ip = getClientIp(headers);
    const ua = headers.get("user-agent");
    const viewerHash = computeVoterHash(ip, ua);

    // Ensure the post exists
    const post = await prisma.blogPost.findUnique({ where: { slug } });
    if (!post || post.status !== "PUBLISHED") return new NextResponse("Not Found", { status: 404 });

    // Best-effort dedupe using SettingsKV with a composite key
    const settingsKey = `like:${post.id}:${viewerHash}`;
    const existing = await prisma.settingsKV.findUnique({ where: { key: settingsKey } }).catch(() => null);
    if (existing) {
      return new NextResponse("Already liked", { status: 429 });
    }

    await prisma.$transaction(async (tx) => {
      // Use raw SQL to avoid type mismatches before client is regenerated
      await tx.$executeRaw`UPDATE "BlogPost" SET "likes" = "likes" + 1 WHERE "id" = ${post.id}`;
      await tx.settingsKV.upsert({
        where: { key: settingsKey },
        create: { key: settingsKey, value: { t: Date.now() } },
        update: { value: { t: Date.now() } },
      });
    });

    const response = NextResponse.json({ ok: true });
    response.headers.set("Set-Cookie", `liked_${encodeURIComponent(slug)}=1; Path=/; Max-Age=31536000; SameSite=Lax`);
    return response;
  } catch {
    return new NextResponse("Server Error", { status: 500 });
  }
}


