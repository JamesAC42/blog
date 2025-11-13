"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./entry.module.scss";
import { PageWrapper } from "@/components/PageWrapper/PageWrapper";
import { Button } from "@/components/Button/Button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import markdownStyles from "@/styles/blogpostmarkdown.module.scss";
import { StickerContainer } from "@/components/StickerContainer/StickerContainer";
import Link from "next/link";
import brain from "@/assets/images/brain.jpg";
import Image from "next/image";
import donttrust from "@/assets/images/donttrust.jpg";

type DiaryEntry = {
  title: string;
  content: string;
  publishedAt?: string | null;
  createdAt?: string | null;
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export default function DiaryEntryPage() {
  const params = useParams();
  const slug = (params?.slug as string) ?? "";
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const asciiSidePanel = [
    [
      " /\\_/\\",
      "( o.o )  nothing to report",
      " > ^ <   have a nice day",
    ].join("\n"),
  ];

  useEffect(() => {
    if (!slug) {
      setError("Diary entry not found.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchEntry = async () => {
      setLoading(true);
      setError("");
      const resp = await fetch(`/api/diary/${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (!resp.ok) {
        if (!cancelled) {
          setError(resp.status === 404 ? "Diary entry not found." : "Unable to load diary entry.");
          setEntry(null);
        }
        setLoading(false);
        return;
      }
      const data = await resp.json();
      if (cancelled) {
        return;
      }
      setEntry({
        title: (data.title as string) ?? "",
        content: (data.content as string) ?? "",
        publishedAt: data.publishedAt ? String(data.publishedAt) : null,
        createdAt: data.createdAt ? String(data.createdAt) : null,
      });
      setLoading(false);
    };
    fetchEntry();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const lineCount = entry?.content ? entry.content.split("\n").length : 12;
  const safeLineCount = Math.min(Math.max(lineCount, 12), 400);
  return (
    <PageWrapper>
      <div className={styles.entryPage}>
        <div className={styles.backRow}>
          <Link href="/journal" className={styles.backLink}>
            <Button text="Back to all" small />
          </Link>
        </div>
        <div className={styles.termLayout}>
          <section className={styles.termWindow}>
            <div className={styles.windowChrome}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.statusBar}>
              <span>nvim journal/{slug || "entry"}.md</span>
              <span>{entry ? formatDateTime(entry.publishedAt ?? entry.createdAt) : ""}</span>
            </div>
            <div className={styles.editorBody}>
              <div className={styles.bodyScroll}>
                {loading && <p className={styles.editorState}>loading entry...</p>}
                {!loading && error && <p className={styles.editorState}>{error}</p>}
                {!loading && !error && entry && (
                  <div className={styles.entryContent}>
                    <div className={styles.entryHeader}>
                      <div className={styles.entryMetaBadge}>journal/{slug || "entry"}.md</div>
                      <h1 className={styles.entryTitle}>{entry.title}</h1>
                    </div>
                    <div className={`${markdownStyles.postContent} ${styles.entryBody}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {entry.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modeLine}>
              {loading ? ":read !fetch_entry" : error ? ":q!" : "-- NORMAL --"}
            </div>
          </section>
          <aside className={styles.sideRail}>
            <div className={styles.sideRailCard}>
              <div className={styles.sideRailHeader}>logs</div>
              <div className={styles.asciiStack}>
                {asciiSidePanel.map((art, idx) => (
                  <pre key={idx} aria-hidden>
                    {art}
                  </pre>
                ))}
              </div>
            </div>
            <div className={styles.sideRailCard}>
              <Image src={donttrust} height={300} width={400} alt="donttrust" />
            </div>
            <div className={styles.sideRailCard}>
              <Image src={brain} height={1038} width={736} alt="brain" />
            </div>
          </aside>
        </div>
      </div>
    </PageWrapper>
  );
}
