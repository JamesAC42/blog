import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  imageUrl: z.string().url(),
  caption: z.string().min(1),
  takenAt: z.string().optional(),
  album: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const created = await prisma.scrapbookItem.create({
    data: {
      imageUrl: data.imageUrl,
      caption: data.caption,
      takenAt: data.takenAt ? new Date(data.takenAt) : null,
      album: data.album || null,
      tags: data.tags ?? undefined,
    },
  });
  return NextResponse.json(created);
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  if (!data.id) return new NextResponse("Missing id", { status: 400 });

  const updated = await prisma.scrapbookItem.update({
    where: { id: data.id },
    data: {
      imageUrl: data.imageUrl,
      caption: data.caption,
      takenAt: data.takenAt ? new Date(data.takenAt) : null,
      album: data.album || null,
      tags: data.tags ?? undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });
  await prisma.scrapbookItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });
  const item = await prisma.scrapbookItem.findUnique({ where: { id } });
  if (!item) return new NextResponse("Not Found", { status: 404 });
  return NextResponse.json(item);
}


