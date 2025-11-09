"use client";

import { useEffect, useState } from "react";
import styles from "../admin.module.scss";

type ResultOption = { id: string; label: string; count: number };
type Block = { id: string; question: string; options: ResultOption[] } | null;

export default function ResultsPage() {
  const [poll, setPoll] = useState<Block>(null);
  const [quiz, setQuiz] = useState<Block>(null);
  const [survey, setSurvey] = useState<Block>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/results");
      if (r.ok) {
        const j = await r.json();
        setPoll(j.poll ?? null);
        setQuiz(j.quiz ?? null);
        setSurvey(j.survey ?? null);
      }
    })();
  }, []);

  const renderBlock = (title: string, data: Block) => (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>{title}</div>
      {!data ? (
        <p>None</p>
      ) : (
        <div>
          <p><strong>{data.question}</strong></p>
          <ul>
            {data.options.map((o) => (
              <li key={o.id}>{o.label}: {o.count}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );

  return (
    <div className={styles.adminRoot}>
      <div className={styles.adminContainer}>
        <div className={styles.toolbar}>
          <h1 className={styles.adminTitle}>Results</h1>
          <a className={styles.buttonSecondary + ' ' + styles.backLink} href="/admin">← Back</a>
        </div>
        <div style={{ display: "grid", gap: "1rem" }}>
          {renderBlock("Poll", poll)}
          {renderBlock("Quiz", quiz)}
          {renderBlock("Survey", survey)}
        </div>
      </div>
    </div>
  );
}


