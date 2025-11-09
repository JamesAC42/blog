"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import styles from "../admin.module.scss";

type ScrapbookItem = {
  id?: string;
  imageUrl: string;
  caption: string;
  takenAt?: string | null;
  album?: string | null;
  tags?: string[];
};

export default function AdminScrapbookPage() {
  const [items, setItems] = useState<ScrapbookItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ScrapbookItem | null>(null);
  const [msg, setMsg] = useState("");
  const [tagsText, setTagsText] = useState<string>("");

  const listQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("tags", search.trim());
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    return params.toString();
  }, [search, page, pageSize]);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/scrapbook?${listQuery}`, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        setItems(j.items || []);
        setTotal(j.total || 0);
      }
    })();
  }, [listQuery]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const blank: ScrapbookItem = {
    imageUrl: "",
    caption: "",
    takenAt: "",
    album: "",
    tags: [],
  };

  const upsert = async () => {
    if (!editing) return;
    setMsg("");
    const method = editing.id ? "PUT" : "POST";
    const r = await fetch(`/api/admin/scrapbook`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        imageUrl: editing.imageUrl,
        caption: editing.caption,
        takenAt: editing.takenAt || undefined,
        album: editing.album || undefined,
        tags: (tagsText || "").split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    if (!r.ok) {
      setMsg("Save failed");
      return;
    }
    setMsg("Saved");
    setEditing(null);
    const rl = await fetch(`/api/scrapbook?${listQuery}`, { cache: "no-store" });
    if (rl.ok) {
      const j = await rl.json(); setItems(j.items || []); setTotal(j.total || 0);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    setMsg("");
    const r = await fetch(`/api/admin/scrapbook?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!r.ok) { setMsg("Delete failed"); return; }
    setMsg("Deleted");
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className={styles.adminRoot}>
      <div className={styles.adminContainer}>
        <div className={styles.toolbar}>
          <h1 className={styles.adminTitle}>Manage Scrapbook</h1>
          <a className={styles.buttonSecondary + ' ' + styles.backLink} href="/admin">← Back</a>
        </div>
        {msg && <div className={styles.msg}>{msg}</div>}

        {!editing && (
          <>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>Items</div>
              <div className={styles.fieldRow}>
                <input placeholder="Search by tags (comma-separated)" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
                <button className={styles.buttonPrimary} onClick={() => { setEditing({ ...blank }); setTagsText(""); }}>New item</button>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Caption</th>
                    <th>Album</th>
                    <th>Taken</th>
                    <th>Tags</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id}>
                      <td><Image src={p.imageUrl} alt={p.caption} width={64} height={64} style={{ height: "4rem", width: "auto" }} /></td>
                      <td>{p.caption}</td>
                      <td>{p.album || ""}</td>
                      <td>{p.takenAt ? new Date(p.takenAt).toLocaleDateString() : ""}</td>
                      <td>{Array.isArray(p.tags) ? p.tags.join(", ") : ""}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <button className={styles.buttonSecondary} onClick={async () => {
                            setEditing({ ...p });
                            setTagsText(Array.isArray(p.tags) ? p.tags.join(", ") : "");
                          }}>Edit</button>
                          <button className={styles.buttonSecondary} onClick={() => remove(p.id!)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <div className={styles.sectionHeader}>Edit Item</div>
            <div className={styles.fieldRow}><label>Caption<br/>
              <input value={editing.caption} onChange={(e) => setEditing({ ...(editing as ScrapbookItem), caption: e.target.value })} />
            </label></div>
            <div className={styles.fieldRow}><label>Album (optional)<br/>
              <input value={editing.album ?? ""} onChange={(e) => setEditing({ ...(editing as ScrapbookItem), album: e.target.value })} />
            </label></div>
            <div className={styles.fieldRow}><label>Taken at (ISO or YYYY-MM-DD) (optional)<br/>
              <input value={editing.takenAt ?? ""} onChange={(e) => setEditing({ ...(editing as ScrapbookItem), takenAt: e.target.value })} placeholder="2025-01-01" />
            </label></div>
            <div className={styles.fieldRow}><label>Image URL<br/>
              <div className={styles.inlineRow}>
                <input value={editing.imageUrl} onChange={(e) => setEditing({ ...(editing as ScrapbookItem), imageUrl: e.target.value })} />
                <label className={styles.buttonSecondary}>
                  Upload
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const albumParam = encodeURIComponent((editing.album || "uncategorized").toLowerCase());
                    const resp = await fetch(`/api/admin/scrapbook/upload?filename=${encodeURIComponent(file.name)}&album=${albumParam}`, { method: "POST", headers: { "content-type": file.type || "application/octet-stream" }, body: file });
                    if (resp.ok) {
                      const j = await resp.json();
                      setEditing({ ...(editing as ScrapbookItem), imageUrl: j.url as string });
                    }
                    if (e.currentTarget) {
                      e.currentTarget.value = "";
                    }
                  }} />
                </label>
              </div>
            </label></div>
            <div className={styles.fieldRow}><label>Tags (comma-separated)<br/>
              <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="e.g. Travel, Food" />
            </label></div>
            <div className={styles.actionsRow}>
              <button className={styles.buttonPrimary} onClick={upsert}>Save</button>
              <button className={styles.buttonSecondary} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


