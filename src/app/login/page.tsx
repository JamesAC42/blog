"use client";

import { useState, Suspense } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../admin/admin.module.scss";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, turnstileToken: captchaToken }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "Login failed");
      }
      const next = searchParams.get("next") || "/";
      router.push(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.adminRoot}>
      <div className={styles.adminContainer} style={{ maxWidth: 480 }}>
        <h1 className={styles.adminTitle}>Admin Login</h1>
        <form onSubmit={onSubmit} className={styles.fieldRow}>
          <label>
            <div>Username</div>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            <div>Password</div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string} onSuccess={(t) => setCaptchaToken(t)} />
          {error && <div style={{ color: "red" }}>{error}</div>}
          <div className={styles.actionsRow}>
            <button className={styles.buttonPrimary} type="submit" disabled={loading || !captchaToken}>{loading ? "Logging in..." : "Login"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.adminRoot}><div className={styles.adminContainer}><h1 className={styles.adminTitle}>Admin Login</h1><p>Loading…</p></div></div>}>
      <LoginContent />
    </Suspense>
  );
}


