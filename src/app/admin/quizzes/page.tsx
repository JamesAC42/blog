"use client";

import { useEffect, useState } from "react";
import styles from "../admin.module.scss";

type Option = { id?: string; label: string; sort?: number };

export default function AdminQuizzesPage() {
  const [quizId, setQuizId] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<Option[]>([{ label: "" }, { label: "" }]);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [active, setActive] = useState<boolean>(true);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/quizzes/active");
      if (r.ok) {
        const j = await r.json();
        setQuizId(j.id);
        setQuestion(j.question);
        setOptions((j.options || []).map((o: Option) => ({ id: o.id, label: o.label })));
        const idx = (j.options || []).findIndex((o: Option) => o.id === j.correctOptionId);
        setCorrectIndex(idx >= 0 ? idx : 0);
        setActive(true);
      }
    })();
  }, []);

  const save = async () => {
    setMsg("");
    const body = { question, options, correctIndex, active };
    let id = quizId;
    if (!id) {
      const r = await fetch("/api/admin/quizzes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) { setMsg("Failed to create"); return; }
      const j = await r.json();
      id = j.id;
      setQuizId(id);
      // After create, reload options so we have their IDs
      const ra = await fetch(`/api/quizzes/active`);
      if (ra.ok) {
        const jj = await ra.json();
        setOptions((jj.options || []).map((o: Option) => ({ id: o.id, label: o.label })));
      }
    } else {
      const r = await fetch(`/api/admin/quizzes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, active }) });
      if (!r.ok) { setMsg("Failed to update quiz"); return; }
      const ro = await fetch(`/api/admin/quizzes/${id}/options`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ options }) });
      if (!ro.ok) { setMsg("Failed to update options"); return; }
      const updated = await ro.json();
      setOptions((updated.options || []).map((o: Option) => ({ id: o.id, label: o.label })));
      const optId = (updated.options || [])[correctIndex]?.id;
      if (optId) {
        await fetch(`/api/admin/quizzes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ correctOptionId: optId }) });
      } else {
        setMsg("Select a correct answer after saving options");
      }
    }
    setMsg("Saved");
  };

  const addOption = () => setOptions([...options, { label: "" }]);
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i));

  return (
    <div className={styles.adminRoot}>
      <div className={styles.adminContainer}>
      <div className={styles.toolbar}>
        <h1 className={styles.adminTitle}>Manage Quiz</h1>
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
          <div key={i} className={styles.optionRowThree}>
            <input type="radio" name="correct" checked={i === correctIndex} onChange={() => setCorrectIndex(i)} />
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


