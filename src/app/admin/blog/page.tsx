"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../admin.module.scss";
import localStyles from "./adminblog.module.scss";
import markdownStyles from "@/styles/blogpostmarkdown.module.scss";
import MarkdownToolbar from "@/components/MarkdownToolbar/MarkdownToolbar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

type BlogPost = {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  tags: string[];
  coverImage?: string | null;
  status: "DRAFT" | "PUBLISHED";
  isFeatured?: boolean;
  publishedAt?: string | null;
  markdown?: string;
};

const makeSlug = (text: string) =>
  (text || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

const getDraftKey = (title?: string, slug?: string) => {
  const keySlug = (slug && slug.length) ? slug : makeSlug(title || "");
  return keySlug ? `blog-autosave:${keySlug}` : "";
};

export default function AdminBlogPage() {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [msg, setMsg] = useState("");
  const [tagsText, setTagsText] = useState<string>("");
  const [preview, setPreview] = useState<boolean>(false);

  

  const listQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    return params.toString();
  }, [search, page, pageSize]);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/admin/blog/posts/list?${listQuery}`, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        setItems(j.items || []);
        setTotal(j.total || 0);
      }
    })();
  }, [listQuery]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const blank: BlogPost = {
    title: "",
    slug: "",
    excerpt: "",
    tags: [],
    coverImage: "",
    status: "DRAFT",
    isFeatured: false,
    markdown: "# New post\n\nWrite your content in markdown here.",
  };

  const upsert = async () => {
    if (!editing) return;
    setMsg("");
    const method = editing.id ? "PUT" : "POST";
    const r = await fetch(`/api/admin/blog/posts`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        title: editing.title,
        slug: editing.slug || undefined,
        excerpt: editing.excerpt || undefined,
        tags: (tagsText || "").split(",").map((s) => s.trim()).filter(Boolean),
        coverImage: editing.coverImage || undefined,
        markdown: editing.markdown || "",
        status: editing.status,
        isFeatured: !!editing.isFeatured,
        publishedAt: editing.publishedAt || undefined,
      }),
    });
    if (!r.ok) {
      let details = "";
      try { const j = await r.json(); details = typeof j.error === "string" ? j.error : JSON.stringify(j.error); } catch {}
      setMsg(`Save failed${details ? `: ${details}` : ""}`);
      return;
    }
    // Clear autosave for this post on successful save
    try {
      const k = getDraftKey(editing.title, editing.slug);
      if (k) localStorage.removeItem(k);
    } catch {}
    setMsg("Saved");
    setEditing(null);
    // refresh list
    const rl = await fetch(`/api/admin/blog/posts/list?${listQuery}`, { cache: "no-store" });
    if (rl.ok) {
      const j = await rl.json(); setItems(j.items || []); setTotal(j.total || 0);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    setMsg("");
    const r = await fetch(`/api/admin/blog/posts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!r.ok) { setMsg("Delete failed"); return; }
    setMsg("Deleted");
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const openEdit = async (p: BlogPost) => {
    const r = await fetch(`/api/admin/blog/posts?id=${encodeURIComponent(p.id!)}`);
    if (r.ok) {
      const j = await r.json();
      setEditing({
        id: j.id,
        title: j.title,
        slug: j.slug,
        excerpt: j.excerpt,
        tags: j.tags || [],
        coverImage: j.coverImage,
        status: j.status,
        isFeatured: j.isFeatured,
        publishedAt: j.publishedAt,
        markdown: j.markdown || "",
      });
      setTagsText((j.tags || []).join(", "));
    } else {
      setEditing({ ...p });
      setTagsText(((p.tags as string[]) || []).join(", "));
    }
  };

  // Attempt to restore autosave when editing changes
  useEffect(() => {
    if (!editing) return;
    try {
      const keyCandidates = [getDraftKey(editing.title, editing.slug)];
      const alt = getDraftKey(editing.title, undefined);
      if (alt && alt !== keyCandidates[0]) keyCandidates.push(alt);
      for (const k of keyCandidates) {
        if (!k) continue;
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const draft = JSON.parse(raw) as Partial<BlogPost> & { tagsText?: string; title?: string };
        if (draft && draft.title && draft.title === editing.title) {
          setEditing({
            ...(editing as BlogPost),
            title: draft.title ?? editing.title,
            slug: draft.slug ?? editing.slug,
            excerpt: draft.excerpt ?? editing.excerpt,
            coverImage: draft.coverImage ?? editing.coverImage,
            status: (draft.status as BlogPost["status"]) ?? editing.status,
            isFeatured: draft.isFeatured ?? editing.isFeatured,
            publishedAt: draft.publishedAt ?? editing.publishedAt,
            markdown: draft.markdown ?? editing.markdown,
            tags: editing.tags, // we store tags via tagsText separately below
          });
          setTagsText(draft.tagsText ?? tagsText);
          setMsg("Restored draft from autosave");
          break;
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id, editing?.slug, editing?.title]);

  // Autosave every minute
  useEffect(() => {
    if (!editing) return;
    const interval = setInterval(() => {
      try {
        const k = getDraftKey(editing.title, editing.slug);
        if (!k) return;
        const payload = {
          title: editing.title,
          slug: editing.slug,
          excerpt: editing.excerpt,
          coverImage: editing.coverImage,
          status: editing.status,
          isFeatured: editing.isFeatured,
          publishedAt: editing.publishedAt,
          markdown: editing.markdown,
          tagsText,
          updatedAt: new Date().toISOString(),
          version: 1,
        };
        localStorage.setItem(k, JSON.stringify(payload));
      } catch {}
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [editing, tagsText]);

  const mdRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <div className={styles.adminRoot}>
      <div className={styles.adminContainer}>
        <div className={styles.toolbar}>
          <h1 className={styles.adminTitle}>Manage Blog</h1>
          <a className={styles.buttonSecondary + ' ' + styles.backLink} href="/admin">← Back</a>
        </div>
        {msg && <div className={styles.msg}>{msg}</div>}

        {!editing && (
          <>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>Posts</div>
              <div className={styles.fieldRow}>
                <input placeholder="Search title/slug/excerpt" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
                <button className={styles.buttonPrimary} onClick={() => { setEditing({ ...blank }); setTagsText(""); }}>New post</button>
              </div>
              <div className={localStyles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Slug</th>
                      <th>Status</th>
                      <th>Featured</th>
                      <th>Published</th>
                      <th>Tags</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.id}>
                        <td>{p.title}</td>
                        <td>{p.slug}</td>
                        <td><span className={styles.statusTag}>{p.status}</span></td>
                        <td>{p.isFeatured ? "Yes" : "No"}</td>
                        <td>{p.publishedAt ? new Date(p.publishedAt).toLocaleString() : ""}</td>
                        <td>{(p.tags || []).join(", ")}</td>
                        <td>
                          <div className={styles.tableActions}>
                            <a className={styles.buttonSecondary} href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">View</a>
                            <button className={styles.buttonSecondary} onClick={() => openEdit(p)}>Edit</button>
                            <button className={styles.buttonSecondary} onClick={() => remove(p.id!)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.actionsRow}>
                <button className={styles.buttonSecondary} onClick={() => setPage((p) => Math.max(1, p - 1))}>{"< Prev"}</button>
                <span>{page} / {totalPages}</span>
                <button className={styles.buttonSecondary} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{"Next >"}</button>
              </div>
            </div>
          </>
        )}

        {editing && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>Edit Post</div>
            <div className={styles.fieldRow}><label>Title<br/>
              <input value={editing.title} onChange={(e) => setEditing({ ...(editing as BlogPost), title: e.target.value })} />
            </label></div>
            <div className={styles.fieldRow}><label>Slug (optional)<br/>
              <input placeholder="auto from title" value={editing.slug ?? ""} onChange={(e) => setEditing({ ...(editing as BlogPost), slug: e.target.value.replace(/[^a-z0-9-]/g, "-").toLowerCase() })} />
            </label></div>
            <div className={styles.fieldRow}><label>Excerpt<br/>
              <textarea value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...(editing as BlogPost), excerpt: e.target.value })} />
            </label></div>
            <div className={styles.fieldRow}><label>Cover image URL (optional)<br/>
              <div className={localStyles.coverUploadRow}>
                <input value={editing.coverImage ?? ""} onChange={(e) => setEditing({ ...(editing as BlogPost), coverImage: e.target.value })} />
                <label className={`${styles.buttonSecondary} ${localStyles.uploadButtonLabel}`}>
                  Upload
                  <input className={localStyles.hiddenFileInput} type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const resp = await fetch(`/api/admin/blog/upload?filename=${encodeURIComponent(file.name)}`, { method: "POST", headers: { "content-type": file.type || "application/octet-stream" }, body: file });
                    if (resp.ok) {
                      const j = await resp.json();
                      setEditing({ ...(editing as BlogPost), coverImage: j.url as string });
                    }

                    if (e.currentTarget) {
                      e.currentTarget.value = "";
                    }
                  }} />
                </label>
              </div>
            </label></div>
            <div className={styles.fieldRow}><label>Tags (comma-separated)<br/>
              <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="e.g. Music, Art, Life" />
            </label></div>
            <div className={styles.fieldRow}>
              <label><input type="checkbox" checked={!!editing.isFeatured} onChange={(e) => setEditing({ ...(editing as BlogPost), isFeatured: e.target.checked })} /> Featured</label>
              <label>Status
                <select value={editing.status} onChange={(e) => setEditing({ ...(editing as BlogPost), status: e.target.value as BlogPost["status"] })}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </label>
              <label>Published at (ISO)
                <input value={editing.publishedAt ?? ""} onChange={(e) => setEditing({ ...(editing as BlogPost), publishedAt: e.target.value })} placeholder="2025-01-01T00:00:00Z" />
              </label>
            </div>
            <div className={styles.fieldRow}><label>Markdown
              <MarkdownToolbar
                value={editing.markdown ?? ""}
                onChange={(next) => setEditing({ ...(editing as BlogPost), markdown: next })}
                onUploadImage={async (file) => {
                  const resp = await fetch(`/api/admin/blog/upload?filename=${encodeURIComponent(file.name)}`, { method: "POST", headers: { "content-type": file.type || "application/octet-stream" }, body: file });
                  if (resp.ok) { const j = await resp.json(); return j.url as string; }
                  return "";
                }}
                disabled={preview}
                textareaRef={mdRef}
              />
              <div className={localStyles.previewToggleRow}>
                <label><input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} /> Preview</label>
              </div>
              {!preview && (
                <textarea ref={mdRef} className={localStyles.markdownEditorTextarea} value={editing.markdown ?? ""} onChange={(e) => setEditing({ ...(editing as BlogPost), markdown: e.target.value })} onPaste={async (e) => {
                  if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
                    const file = e.clipboardData.files[0];
                    const url = await (async () => {
                      const resp = await fetch(`/api/admin/blog/upload?filename=${encodeURIComponent(file.name)}`, { method: "POST", headers: { "content-type": file.type || "application/octet-stream" }, body: file });
                      if (resp.ok) { const j = await resp.json(); return j.url as string; }
                      return "";
                    })();
                    if (url) {
                      e.preventDefault();
                      const next = `${editing.markdown || ""}\n![image](${url})`;
                      setEditing({ ...(editing as BlogPost), markdown: next });
                    }
                  }
                }} />
              )}
              {preview && (
                <div className={`windowStyle ${markdownStyles.postContent}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {editing.markdown ?? ""}
                  </ReactMarkdown>
                </div>
              )}
            </label></div>
            <div className={styles.actionsRow}>
              <button className={styles.buttonPrimary} onClick={upsert}>Save</button>
              <button className={styles.buttonSecondary} onClick={() => {
                try {
                  if (editing) {
                    const k = getDraftKey(editing.title, editing.slug);
                    if (k) localStorage.removeItem(k);
                    const alt = getDraftKey(editing.title, undefined);
                    if (alt && alt !== k) localStorage.removeItem(alt);
                  }
                } catch {}
                setEditing(null);
              }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


