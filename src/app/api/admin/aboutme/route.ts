import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthCookieName, verifyAdminJwt } from "@/lib/auth";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";

const RootContentDir = path.join(process.cwd(), "content", "aboutme");
const FileName = "aboutme.md";

function requireAdmin(request: Request) {
  const token = (request.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((c) => c.startsWith(`${getAuthCookieName()}=`))
    ?.split("=")?.[1];
  return verifyAdminJwt(token || "");
}

export async function GET(request: Request) {
  const payload = await requireAdmin(request).catch(() => null);
  if (!payload) return new NextResponse("Unauthorized", { status: 401 });

  const about = await prisma.aboutMe.findFirst();
  if (!about) return NextResponse.json({ id: 1, markdown: "", updatedAt: null });
  const absPath = path.isAbsolute(about.markdownPath) ? about.markdownPath : path.join(process.cwd(), about.markdownPath);
  let markdown = "";
  try {
    markdown = await fs.readFile(absPath, "utf8");
  } catch {
    markdown = "";
  }
  return NextResponse.json({ id: 1, markdown, updatedAt: about.updatedAt });
}

const upsertSchema = z.object({ markdown: z.string().min(1) });

export async function PUT(request: Request) {
  const payload = await requireAdmin(request).catch(() => null);
  if (!payload) return new NextResponse("Unauthorized", { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { markdown } = parsed.data;

  await fs.mkdir(RootContentDir, { recursive: true });
  const absPath = path.join(RootContentDir, FileName);
  await fs.writeFile(absPath, markdown, "utf8");

  const record = await prisma.aboutMe.upsert({
    where: { id: 1 },
    create: { id: 1, markdownPath: path.relative(process.cwd(), absPath) },
    update: { markdownPath: path.relative(process.cwd(), absPath) },
  });

  return NextResponse.json({ ok: true, updatedAt: record.updatedAt });
}


