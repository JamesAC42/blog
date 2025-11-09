"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../admin.module.scss";
import MarkdownToolbar from "@/components/MarkdownToolbar/MarkdownToolbar";
import markdownStyles from "@/styles/blogpostmarkdown.module.scss";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function AdminAboutMePage() {
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const ra = await fetch(`/api/admin/auth/me`, { cache: "no-store" });
        if (!ra.ok) throw new Error("Unauthorized");
        const ja = await ra.json();
        if (!ja.isAdmin) throw new Error("Unauthorized");
        setIsAdmin(true);

        const r = await fetch(`/api/admin/aboutme`, { cache: "no-store" });
        if (!r.ok) throw new Error("Failed to load");
        const j = await r.json();
        setMarkdown(j.markdown || "");
      } catch (e) {
        setError((e as Error).message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/aboutme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });
      if (!r.ok) throw new Error("Failed to save");
      // simple toast
      try { (window as unknown as { toast?: (msg: string) => void }).toast?.("Saved"); } catch {}
    } catch (e) {
      try { (window as unknown as { toast?: (msg: string) => void }).toast?.((e as Error).message || "Failed to save"); } catch {}
    } finally {
      setSaving(false);
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <div className={styles.adminRoot}>
      <div className={styles.adminContainer}>
        <div className={styles.toolbar}>
          <h1 className={styles.adminTitle}>Edit About Me</h1>
          <div>
            <a className={styles.buttonSecondary + ' ' + styles.backLink} href="/admin">← Back</a>
            <a className={styles.buttonSecondary} href="/aboutme" target="_blank" rel="noopener noreferrer" style={{ marginLeft: "1rem" }}>Open Page</a>
            <button className={styles.buttonPrimary} onClick={save} disabled={!isAdmin || saving} style={{ marginLeft: "1rem" }}>{saving ? "Saving..." : "Save"}</button>
          </div>
        </div>
        {error && <div className={styles.msg}>{error}</div>}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>Content</div>
          {loading ? (
            <p>Loading…</p>
          ) : (
            <div>
              <MarkdownToolbar value={markdown} onChange={setMarkdown} textareaRef={textareaRef} 
                onUploadImage={async (file) => {
                  const resp = await fetch(`/api/admin/blog/upload?filename=${encodeURIComponent(file.name)}`, { method: "POST", headers: { "content-type": file.type || "application/octet-stream" }, body: file });
                  if (resp.ok) { const j = await resp.json(); return j.url as string; }
                  return "";
                }}/>
              <div className={styles.fieldRow}>
                <label>Markdown
                  <div className={styles.previewToggle}>
                    <label><input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />View Preview</label>
                  </div>
                  <br/>
                  {!preview && (
                    <textarea ref={textareaRef} value={markdown} onChange={(e) => setMarkdown(e.target.value)} placeholder="# About Me\n\nWrite your content in markdown here." />
                  )}
                  {preview && (
                    <div className={`windowStyle ${markdownStyles.postContent}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {markdown}
                      </ReactMarkdown>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


