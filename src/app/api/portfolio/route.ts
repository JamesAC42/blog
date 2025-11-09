import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const record = await prisma.settingsKV.findUnique({ where: { key: "portfolio" } });
  const value = (record?.value as unknown) as { intro?: string; projects?: unknown[] } | null;

  const intro = value && typeof value.intro === "string" ? value.intro : "";
  const projects = Array.isArray(value?.projects) ? value?.projects : [];

  return NextResponse.json({ intro, projects });
}
