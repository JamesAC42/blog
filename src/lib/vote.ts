import crypto from "crypto";

export function getClientIp(headers: Headers): string | undefined {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return undefined;
}

export function computeVoterHash(ip: string | undefined, userAgent: string | null): string {
  const base = `${ip ?? ""}|${userAgent ?? ""}`;
  return crypto.createHash("sha256").update(base).digest("hex");
}


