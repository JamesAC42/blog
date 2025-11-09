import { NextResponse } from "next/server";
import { getAuthCookieName, verifyAdminJwt } from "@/lib/auth";

export async function GET(request: Request) {
  const token = (request.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((c) => c.startsWith(`${getAuthCookieName()}=`))
    ?.split("=")?.[1];
  const payload = token ? await verifyAdminJwt(token) : null;
  const isAdmin = !!payload;
  return NextResponse.json({ isAdmin });
}



