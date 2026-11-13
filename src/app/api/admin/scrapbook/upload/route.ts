import { NextResponse } from "next/server";
import { StorageConfigError, makeKey, uploadObject } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const contentType = request.headers.get("content-type") || "application/octet-stream";
    const album = (url.searchParams.get("album") || "uncategorized").replace(/[^a-z0-9-_/]/gi, "-");
    const key = makeKey(`scrapbook/${album}`, url.searchParams.get("filename"));
    const body = Buffer.from(await request.arrayBuffer());
    const result = await uploadObject(key, body, contentType);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    if (e instanceof StorageConfigError) return NextResponse.json({ error: e.message }, { status: 500 });
    return new NextResponse("Upload failed", { status: 500 });
  }
}
