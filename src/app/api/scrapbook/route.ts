import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") || 20)));
  const skip = (page - 1) * pageSize;
  const albumParam = (url.searchParams.get("album") || "").trim();
  // Server-side tag filtering is not implemented for JSON tags; client handles tag filters.
  // When filtering by album, normalize by trimming and case-insensitive compare.
  // We do a 2-pass query to ensure correct total and pagination even if DB values contain stray whitespace.
  if (albumParam) {
    const normalize = (s?: string | null) => (s ?? "").trim().toLowerCase();
    const wantUncategorized = albumParam === "__null__";
    const target = normalize(wantUncategorized ? "" : albumParam);

    // Broad prefilter to reduce dataset size
    const broadWhere: Prisma.ScrapbookItemWhereInput = wantUncategorized
      ? {}
      : { album: { contains: albumParam, mode: "insensitive" } };

    const allForAlbum = await prisma.scrapbookItem.findMany({
      where: broadWhere,
      orderBy: { createdAt: "desc" },
      select: { id: true, album: true },
    });

    const matchingIds = allForAlbum
      .filter(r => {
        const norm = normalize(r.album);
        return wantUncategorized ? norm.length === 0 : norm === target;
      })
      .map(r => r.id);

    const total = matchingIds.length;
    const pageIds = matchingIds.slice(skip, skip + pageSize);

    let items = [] as Awaited<ReturnType<typeof prisma.scrapbookItem.findMany>>;
    if (pageIds.length > 0) {
      const fetched = await prisma.scrapbookItem.findMany({
        where: { id: { in: pageIds } },
        // no order guarantee with IN, so reorder in memory
      });
      const orderMap = new Map(pageIds.map((id, idx) => [id, idx] as const));
      items = fetched.sort((a, b) => (orderMap.get(a.id)! - orderMap.get(b.id)!));
    }

    return NextResponse.json({ total, page, pageSize, items });
  }

  // No album filter: simple paginated query
  const [total, items] = await Promise.all([
    prisma.scrapbookItem.count({}),
    prisma.scrapbookItem.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, items });
}


