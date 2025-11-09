import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Fetch distinct album names (preserve original casing), exclude nulls/empty strings
  const rows = await prisma.scrapbookItem.findMany({
    where: {
      NOT: [{ album: null }, { album: "" }],
    },
    distinct: ["album"],
    select: { album: true },
    orderBy: { album: "asc" },
  });

  const albums = Array.from(
    new Map(
      rows
        .map(r => (typeof r.album === "string" ? r.album.trim() : ""))
        .filter(a => a.length > 0)
        // de-duplicate by lowercase key but keep first-seen casing
        .map(a => [a.toLowerCase(), a] as const)
    ).values()
  ).sort((a, b) => a.localeCompare(b));

  return NextResponse.json({ albums });
}


