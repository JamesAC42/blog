"use client";

import { useEffect, useState } from "react";
import styles from "../admin.module.scss";

type Option = { id?: string; label: string; sort?: number };

export default function AdminSurveysPage() {
  const [surveyId, setSurveyId] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<Option[]>([{ label: "" }, { label: "" }]);
  const [active, setActive] = useState<boolean>(true);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/surveys/active");
      if (r.ok) {
        const j = await r.json();
        setSurveyId(j.id);
        setQuestion(j.question);
        setOptions((j.choices || []).map((o: Option) => ({ id: o.id, label: o.label })));
        setActive(true);
      }
    })();
  }, []);

  const save = async () => {
    setMsg("");
    const body = { question, options, active };
    let id = surveyId;
    if (!id) {
      const r = await fetch("/api/admin/surveys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) { setMsg("Failed to create"); return; }
      const j = await r.json();
      id = j.id;
      setSurveyId(id);
    } else {
      const r = await fetch(`/api/admin/surveys/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, active }) });
      if (!r.ok) { setMsg("Failed to update survey"); return; }
      const ro = await fetch(`/api/admin/surveys/${id}/options`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ options }) });
      if (!ro.ok) { setMsg("Failed to update options"); return; }
    }
    setMsg("Saved");
  };

  const addOption = () => setOptions([...options, { label: "" }]);
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i));

  return (
    <div className={styles.adminRoot}>
      <div className={styles.adminContainer}>
      <div className={styles.toolbar}>
        <h1 className={styles.adminTitle}>Manage Survey</h1>
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
        <label>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
        </label>
      </div>
      <div className={styles.actionsRow}>
        <button className={styles.buttonPrimary} onClick={save}>Save</button>
        <a className={styles.buttonSecondary + ' ' + styles.backLink} href="/admin">Back</a>
      </div>
      </div>
    </div>
  );
}


