export const runtime = "nodejs";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { signAdminJwt, getAuthCookieName, verifyTurnstile } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const { username, password, turnstileToken } = body as { username?: string; password?: string; turnstileToken?: string };
  if (!username || !password || !turnstileToken) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0] || undefined;
  const captchaOk = await verifyTurnstile(turnstileToken, ip);
  if (!captchaOk) return NextResponse.json({ error: "captcha" }, { status: 400 });

  const envUser = process.env.ADMIN_USERNAME;
  const envHash = process.env.ADMIN_PASSWORD_HASH;
  console.log('[auth/login] keys:', Object.keys(body || {}));
  console.log('[auth/login] userEq:', username === envUser);
  console.log('[auth/login] passLen:', password.length);
  console.log('[auth/login] hashPrefix:', envHash?.slice(0, 7));
  if (!envUser || !envHash) return NextResponse.json({ error: "config" }, { status: 500 });
  if (username !== envUser) return NextResponse.json({ error: "username" }, { status: 401 });

  const ok = await bcrypt.compare(password, envHash);
  const okTrim = await bcrypt.compare(password.trim(), envHash);

  if (!ok) return NextResponse.json({ error: "password" }, { status: 401 });
  console.log('[auth/login] compare raw:', ok, 'trim:', okTrim);

  const token = await signAdminJwt({ u: envUser, r: "admin" });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getAuthCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}


