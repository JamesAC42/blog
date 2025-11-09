import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const item = await prisma.settingsKV.findUnique({ where: { key: "profile" } });
  const value = (item?.value as Record<string, unknown>) || {};
  const headerText = typeof value["headerText"] === "string" ? (value["headerText"] as string) : "";
  const subHeaderText = typeof value["subHeaderText"] === "string" ? (value["subHeaderText"] as string) : "";
  return NextResponse.json({ headerText, subHeaderText });
}


