"use client";

import { useEffect, useState } from "react";
import styles from "../admin.module.scss";

type Option = { id?: string; label: string; sort?: number };

export default function AdminPollsPage() {
  const [pollId, setPollId] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<Option[]>([{ label: "" }, { label: "" }]);
  const [activeFrom, setActiveFrom] = useState<string>("");
  const [activeTo, setActiveTo] = useState<string>("");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/polls/active");
      if (r.ok) {
        const j = await r.json();
        setPollId(j.id);
        setQuestion(j.question);
        setOptions((j.options || []).map((o: Option) => ({ id: o.id, label: o.label })));
      }
    })();
  }, []);

  const save = async () => {
    setMsg("");
    let id = pollId;
    if (!id) {
      const r = await fetch("/api/admin/polls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, options, activeFrom, activeTo: activeTo || null }) });
      if (!r.ok) { setMsg("Failed to create"); return; }
      const j = await r.json();
      id = j.id;
      setPollId(id);
    } else {
      const r = await fetch(`/api/admin/polls/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, activeFrom: activeFrom || undefined, activeTo: activeTo || null }) });
      if (!r.ok) { setMsg("Failed to update poll"); return; }
    }
    const ro = await fetch(`/api/admin/polls/${id}/options`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ options }) });
    if (!ro.ok) { setMsg("Failed to update options"); return; }
    setMsg("Saved");
  };

  const addOption = () => setOptions([...options, { label: "" }]);
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i));

  return (
    <div className={styles.adminRoot}>
      <div className={styles.adminContainer}>
      <div className={styles.toolbar}>
        <h1 className={styles.adminTitle}>Manage Poll</h1>
        <a className={styles.buttonSecondary + ' ' + styles.backLink} href="/admin">← Back</a>
      </div>
      {msg && <div className={styles.msg}>{msg}</div>}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>Question</div>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} />
      </div>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>Options</div>
        {options.map((o, i) => (
          <div key={i} className={styles.optionRowTwo}>
            <input value={o.label} onChange={(e) => { const arr = [...options]; arr[i] = { ...arr[i], label: e.target.value }; setOptions(arr); }} />
            <button className={styles.buttonSecondary} onClick={() => removeOption(i)}>Remove</button>
          </div>
        ))}
        <button className={styles.buttonSecondary} onClick={addOption}>Add option</button>
      </div>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>Active window</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <label>From (ISO)
            <input value={activeFrom} onChange={(e) => setActiveFrom(e.target.value)} placeholder="2025-01-01T00:00:00Z" />
          </label>
          <label>To (optional)
            <input value={activeTo} onChange={(e) => setActiveTo(e.target.value)} placeholder="" />
          </label>
        </div>
      </div>
      <div className={styles.actionsRow}>
        <button className={styles.buttonPrimary} onClick={save}>Save</button>
        <a className={styles.buttonSecondary + ' ' + styles.backLink} href="/admin">Back</a>
      </div>
      </div>
    </div>
  );
}


