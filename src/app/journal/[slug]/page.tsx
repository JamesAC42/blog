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
import Image from "next/image";
import keyboard from "@/assets/images/diary/keyboardtransparent.png";

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

  return (
    <PageWrapper>
      <div className={styles.entryPage}>
        <div className={styles.backRow}>
          <Link href="/journal" className={styles.backLink}>
            <Button text="Back to all" small />
          </Link>
        </div>
        <div className={styles.scene}>
          <div className={styles.monitorZone}>
            <div className={styles.monitorOuter}>
              <div className={styles.monitorTop}>
                <span className={styles.monitorBrand}>IBM</span>
                <div className={styles.monitorControls}>
                  <span className={styles.monitorControl} aria-hidden />
                  <span className={styles.monitorControl} aria-hidden />
                  <span className={styles.monitorControl} aria-hidden />
                </div>
              </div>
              <div className={styles.monitorScreen}>
                <div className={styles.screenInner}>
                  {loading && <p className={`${markdownStyles.postContent} ${styles.screenMessage}`}>Loading...</p>}
                  {!loading && error && <p className={`${markdownStyles.postContent} ${styles.screenMessage}`}>{error}</p>}
                  {!loading && !error && entry && (
                    <div className={styles.screenContent}>
                      <div className={styles.entryHeader}>
                        <h1 className={styles.entryTitle}>{entry.title}</h1>
                        <div className={styles.entryMeta}>
                          <span className={styles.metaItem}>
                            {formatDateTime(entry.publishedAt ?? entry.createdAt)}
                          </span>
                        </div>
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
            </div>
            <div className={styles.deskArea} aria-hidden>
              <div className={styles.keyboardWrap}>
                <Image src={keyboard} alt="mechanical keyboard" className={styles.keyboardImage} />
              </div>
              <div className={styles.mouse}>
                <span className={styles.mouseWheel} />
              </div>
            </div>
          </div>
          <aside className={styles.sidePanel}>
            <div className={styles.sidePanelContent}>
              <div className={styles.sidePanelHeader}>Signal Board</div>
              <p className={styles.sidePanelNote}>Loop in your favorite gifs or widgets here soon.</p>
              <div className={styles.sidePanelDivider} />
              <div className={styles.stickerWrap}>
                <StickerContainer blogId={slug} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageWrapper>
  );
}
