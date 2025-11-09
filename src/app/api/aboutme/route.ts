import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  const about = await prisma.aboutMe.findFirst({ select: { markdownPath: true, updatedAt: true } });
  if (!about) return NextResponse.json({ markdown: "", updatedAt: null });

  const absolutePath = path.isAbsolute(about.markdownPath)
    ? about.markdownPath
    : path.join(process.cwd(), about.markdownPath);
  let markdown = "";
  try {
    markdown = await fs.readFile(absolutePath, "utf8");
  } catch {
    markdown = "";
  }

  return NextResponse.json({ markdown, updatedAt: about.updatedAt });
}


