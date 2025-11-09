"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../admin.module.scss";
import localStyles from "./admindiary.module.scss";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import markdownStyles from "@/styles/blogpostmarkdown.module.scss";
import MarkdownToolbar from "@/components/MarkdownToolbar/MarkdownToolbar";

type DiaryEntryListItem = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt?: string | null;
  updatedAt?: string | null;
};

type DiaryEntryForm = {
  id?: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  content: string;
  publishedAt: string;
};

const blankEntry: DiaryEntryForm = {
  title: "",
  slug: "",
  status: "DRAFT",
  content: "",
  publishedAt: "",
};

export default function AdminDiaryPage() {
  const [items, setItems] = useState<DiaryEntryListItem[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<DiaryEntryForm | null>(null);
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState("");

  const listQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    return params.toString();
  }, [search, statusFilter, page, pageSize]);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/admin/diary/entries/list?${listQuery}`, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        setItems(Array.isArray(j.items) ? j.items : []);
        setTotal(typeof j.total === "number" ? j.total : 0);
      }
    })();
  }, [listQuery]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openEditor = async (id: string) => {
    setMsg("");
    const r = await fetch(`/api/admin/diary/entries?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!r.ok) {
      setMsg("Could not load entry");
      return;
    }
    const entry = await r.json();
    setPreview(false);
    setEditing({
      id: entry.id as string,
      title: (entry.title as string) ?? "",
      slug: (entry.slug as string) ?? "",
      status: (entry.status as "DRAFT" | "PUBLISHED") ?? "DRAFT",
      content: (entry.content as string) ?? "",
      publishedAt: entry.publishedAt ? String(entry.publishedAt) : "",
    });
  };

  const upsert = async () => {
    if (!editing) {
      return;
    }
    setMsg("");
    const method = editing.id ? "PUT" : "POST";
    const r = await fetch(`/api/admin/diary/entries`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        title: editing.title,
        slug: editing.slug ? editing.slug : undefined,
        status: editing.status,
        content: editing.content,
        publishedAt: editing.publishedAt || undefined,
      }),
    });
    if (!r.ok) {
      setMsg("Save failed");
      return;
    }
    setMsg("Saved");
    setEditing(null);
    setPreview(false);
    const rl = await fetch(`/api/admin/diary/entries/list?${listQuery}`, { cache: "no-store" });
    if (rl.ok) {
      const j = await rl.json();
      setItems(Array.isArray(j.items) ? j.items : []);
      setTotal(typeof j.total === "number" ? j.total : 0);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry?")) {
      return;
    }
    setMsg("");
    const r = await fetch(`/api/admin/diary/entries?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!r.ok) {
      setMsg("Delete failed");
      return;
    }
    setMsg("Deleted");
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const formatListDate = (value?: string | null) => {
    if (!value) {
      return "";
    }
    return new Date(value).toLocaleDateString();
  };

  const mdRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <div className={styles.adminRoot}>
      <div className={styles.adminContainer}>
        <div className={styles.toolbar}>
          <h1 className={styles.adminTitle}>Manage Diary</h1>
          <a className={`${styles.buttonSecondary} ${styles.backLink}`} href="/admin">{"<- Back"}</a>
        </div>
        {msg && <div className={styles.msg}>{msg}</div>}

        {!editing && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>Entries</div>
            <div className={styles.fieldRow}>
              <input
                placeholder="Search title or content"
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              />
              <select
                value={statusFilter}
                onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
              >
                <option value="all">All statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Drafts</option>
              </select>
              <button className={styles.buttonPrimary} onClick={() => { setEditing({ ...blankEntry }); setPreview(false); }}>
                New entry
              </button>
            </div>
            <div className={localStyles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th>Published</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.slug}</td>
                      <td><span className={styles.statusTag}>{item.status}</span></td>
                      <td>{formatListDate(item?.publishedAt)}</td>
                      <td>{formatListDate(item?.updatedAt)}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <button className={styles.buttonSecondary} onClick={() => openEditor(item.id)}>Edit</button>
                          <button className={styles.buttonSecondary} onClick={() => remove(item.id)}>Delete</button>
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
        )}

        {editing && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>{editing.id ? "Edit entry" : "New entry"}</div>
            <div className={styles.fieldRow}>
              <label>Title<br />
                <input
                  value={editing.title}
                  onChange={(e) => {
                    const nextTitle = e.target.value;
                    setEditing((prev) => (prev ? { ...prev, title: nextTitle } : prev));
                  }}
                  placeholder="Diary title"
                />
              </label>
            </div>
            <div className={styles.fieldRow}>
              <label>Slug (optional)<br />
                <input
                  value={editing.slug}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^a-z0-9-]/g, "-").toLowerCase();
                    setEditing((prev) => prev ? { ...prev, slug: sanitized } : prev);
                  }}
                  placeholder="auto-generated from title"
                />
              </label>
            </div>
            <div className={styles.fieldRow}>
              <label>Status<br />
                <select
                  value={editing.status}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, status: e.target.value as DiaryEntryForm["status"] } : prev)}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </label>
              <label>Published at (ISO)<br />
                <input
                  value={editing.publishedAt}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, publishedAt: e.target.value } : prev)}
                  placeholder="2025-01-01T00:00:00Z"
                />
              </label>
            </div>
            <div className={styles.fieldRow}>
              <label>Content
                <MarkdownToolbar
                  value={editing?.content || ""}
                  onChange={(next) => setEditing((prev) => prev ? { ...prev, content: next } : prev)}
                  disabled={preview}
                  textareaRef={mdRef}
                  onUploadImage={async (file) => {
                    const resp = await fetch(`/api/admin/blog/upload?filename=${encodeURIComponent(file.name)}`, { method: "POST", headers: { "content-type": file.type || "application/octet-stream" }, body: file });
                    if (resp.ok) { const j = await resp.json(); return j.url as string; }
                    return "";
                  }}
                />
                <div className={localStyles.previewToggleRow}>
                  <label><input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} /> Preview</label>
                </div>
                {!preview && (
                  <textarea
                    ref={mdRef}
                    className={localStyles.contentTextarea}
                    value={editing.content}
                    onChange={(e) => setEditing((prev) => prev ? { ...prev, content: e.target.value } : prev)}
                    placeholder="Write your diary entry here..."
                  />
                )}
                {preview && (
                  <div className={`windowStyle ${markdownStyles.postContent} ${localStyles.markdownPreview}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                      {editing.content || ""}
                    </ReactMarkdown>
                  </div>
                )}
              </label>
            </div>
            <div className={styles.actionsRow}>
              <button className={styles.buttonPrimary} onClick={upsert}>Save</button>
              <button className={styles.buttonSecondary} onClick={() => { setEditing(null); setPreview(false); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




