import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function GET(_: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const item = await prisma.settingsKV.findUnique({ where: { key } });
  if (!item) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return NextResponse.json(item.value);
}

export async function PUT(request: Request, context: { params: Promise<{ key: string }> }) {
  try {
    const json = await request.json();
    const { key } = await context.params;
    await prisma.settingsKV.upsert({
      where: { key },
      create: { key, value: json },
      update: { value: json },
    });
    revalidateTag("homepage");
    if (key === "profile") {
      revalidateTag("profile");
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }
}


