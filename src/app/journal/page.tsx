"use client";

import { useEffect, useState } from "react";
import styles from "./journal.module.scss";
import { PageWrapper } from "@/components/PageWrapper/PageWrapper";
import HeaderBox from "@/components/HeaderBox/HeaderBox";
import Link from "next/link";
import { Footer } from "@/components/Footer/Footer";

type DiaryEntry = {
  id: string;
  slug: string;
  title: string;
  publishedAt: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toLocaleDateString();
};

export default function Diary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  // total count not displayed; omit state to avoid unused var warning
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    const fetchAllEntries = async () => {
      setLoading(true);
      setError("");
      try {
        const pageSize = 50;
        const page = 1;
        let all: DiaryEntry[] = [];
        // let totalCount = 0;
        // Fetch first page to get total
        const firstResp = await fetch(`/api/diary?page=${page}&pageSize=${pageSize}`, { cache: "no-store" });
        if (!firstResp.ok) throw new Error("Failed to load journal entries");
        const firstData = await firstResp.json();
        const totalCount = typeof firstData.total === "number" ? firstData.total : 0;
        all = (firstData.items || []).map((e: DiaryEntry) => ({ id: e.id, slug: e.slug, title: e.title, publishedAt: e.publishedAt }));
        // Fetch remaining pages (if any)
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        const fetches: Promise<void>[] = [];
        for (let p = 2; p <= totalPages; p++) {
          fetches.push(
            fetch(`/api/diary?page=${p}&pageSize=${pageSize}`, { cache: "no-store" })
              .then((r) => r.ok ? r.json() : Promise.reject(new Error("Failed")))
              .then((d) => {
                const items = (d.items || []).map((e: DiaryEntry) => ({ id: e.id, slug: e.slug, title: e.title, publishedAt: e.publishedAt }));
                all = all.concat(items);
              })
          );
        }
        await Promise.all(fetches);
        if (cancelled) return;
        // Ensure reverse chronological sort by publishedAt
        all.sort((a, b) => {
          const ad = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const bd = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return bd - ad;
        });
        setEntries(all);
        // totalCount available if needed: totalCount || all.length
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Could not load diary entries.");
          setEntries([]);
          // ignore total count
          setLoading(false);
        }
      }
    };
    fetchAllEntries();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleYearCollapsed = (year: number) => {
    setCollapsedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const clearFilter = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
  };

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    setSelectedMonth(null);
  };

  const handleSelectMonth = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  // Build index of years -> months from loaded entries
  const index = entries.reduce((acc: Record<number, Record<number, number>>, e) => {
    const d = e.publishedAt ? new Date(e.publishedAt) : null;
    if (!d) return acc;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    acc[y] = acc[y] || {};
    acc[y][m] = (acc[y][m] || 0) + 1;
    return acc;
  }, {});

  const filtered = entries.filter((e) => {
    if (!selectedYear && !selectedMonth) return true;
    const d = e.publishedAt ? new Date(e.publishedAt) : null;
    if (!d) return false;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    if (selectedYear && !selectedMonth) return y === selectedYear;
    if (selectedYear && selectedMonth) return y === selectedYear && m === selectedMonth;
    return true;
  });

  const formatMonthLabel = (month: number, long?: boolean) =>
    new Date(0, month - 1).toLocaleString("default", { month: long ? "long" : "short" });

  const currentFilterLabel = selectedYear
    ? selectedMonth
      ? `${selectedYear}/${formatMonthLabel(selectedMonth)}`
      : `${selectedYear}`
    : "all entries";

  const directoryTotals: Record<number, number> = Object.keys(index).reduce((acc, key) => {
    const year = Number(key);
    acc[year] = Object.values(index[year]).reduce((sum, value) => sum + value, 0);
    return acc;
  }, {} as Record<number, number>);

  const filePerms = "-rw-r--r--";
  const dirPerms = "drwxr-xr-x";

  return (
    <PageWrapper>
      <div className={styles.diaryPage}>
        <HeaderBox header="Journal" showFlashy={false} />
        <div className={styles.terminalGrid}>
          <section className={styles.directoryTerminal}>
            <div className={styles.windowChrome}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.promptLine}>
              <span className={styles.promptUser}>visitor</span>
              <span className={styles.promptPath}>~/journal</span>
              <span className={styles.promptCommand}>tree -L 2</span>
            </div>
            <ul className={`${styles.directoryList} scrollArea`}>
              {Object.keys(index)
                .map((y) => parseInt(y, 10))
                .sort((a, b) => b - a)
                .map((year) => {
                  const months = Object.keys(index[year])
                    .map((m) => parseInt(m, 10))
                    .sort((a, b) => b - a);
                  return (
                    <li key={year} className={styles.directoryYear}>
                      <div className={styles.dirRow}>
                        <span className={styles.dirPerms}>{dirPerms}</span>
                        <button
                          className={`${styles.dirButton} ${selectedYear === year && !selectedMonth ? styles.active : ""}`}
                          onClick={() => handleSelectYear(year)}
                        >
                          {year}/
                        </button>
                        <span className={styles.dirMeta}>{String(directoryTotals[year] || 0).padStart(2, "0")} files</span>
                        <button className={styles.toggleBtn} onClick={() => toggleYearCollapsed(year)} aria-label="Toggle months">
                          {collapsedYears[year] ? "+" : "−"}
                        </button>
                      </div>
                      {!collapsedYears[year] && (
                        <ul className={styles.monthList}>
                          {months.map((month, idx) => {
                            const branch = idx === months.length - 1 ? "└──" : "├──";
                            return (
                              <li key={month} className={styles.monthRow}>
                                <button
                                  className={`${styles.monthBtn} ${
                                    selectedYear === year && selectedMonth === month ? styles.active : ""
                                  }`}
                                  onClick={() => handleSelectMonth(year, month)}
                                >
                                  <span className={styles.branch}>{branch}</span>
                                  <span className={styles.monthName}>{formatMonthLabel(month)}/</span>
                                  <span className={styles.dirMeta}>{index[year][month]} logs</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
            </ul>
            <div className={styles.commandFooter}>
              <button onClick={clearFilter} className={styles.commandButton}>
                <span className={styles.commandButtonIcon}>↺</span> reset filters
              </button>
              <span className={styles.commandHint}>current filter: {currentFilterLabel}</span>
            </div>
          </section>
          <section className={styles.entriesTerminal}>
            <div className={styles.windowChrome}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.promptLine}>
              <span className={styles.promptUser}>visitor</span>
              <span className={styles.promptPath}>~/journal</span>
              <span className={styles.promptCommand}>
                {selectedYear || selectedMonth ? `cat entries.log | grep "${currentFilterLabel}"` : "cat entries.log"}
              </span>
            </div>
            <div className={`${styles.entriesFeed} scrollArea`}>
              {loading && <div className={styles.stateMessage}>loading entries...</div>}
              {!loading && error && <div className={styles.stateMessage}>{error}</div>}
              {!loading && !error && filtered.length === 0 && <div className={styles.stateMessage}>no entries found</div>}
              {!loading && !error && filtered.length > 0 && (
                <ul className={styles.entriesList}>
                  {filtered.map((entry) => {
                    const date = formatDate(entry.publishedAt);
                    return (
                      <li key={entry.id} className={styles.entryRow}>
                        <Link href={`/journal/${entry.slug}`} className={styles.entryLink}>
                          <span className={styles.filePerms}>{filePerms}</span>
                          <span className={styles.entryDate}>{date || "----"}</span>
                          <span className={styles.entryTitle}>{entry.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className={styles.asciiFooter}>
              <pre aria-hidden>
              {"<・ )))><<\t<・ )))><<\t<・ )))><<\t<・ )))><< >°))))彡       >°))))彡\n\n (°)#))<< (°)#))<<                 >^)))<～～\n\n≧( ° ° )≦ . . . ≧( ° ° )≦"}
              </pre>
            </div>
          </section>
        </div>
      </div>
      <br />
      <br />
      <Footer />  
    </PageWrapper>
  );
}
