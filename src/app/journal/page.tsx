"use client";

import { useEffect, useState } from "react";
import styles from "./journal.module.scss";
import { PageWrapper } from "@/components/PageWrapper/PageWrapper";
import HeaderBox from "@/components/HeaderBox/HeaderBox";
import { Button } from "@/components/Button/Button";
import Image from "next/image";

import swirl from "@/assets/images/stickers/_swirl.png";
import star from "@/assets/images/stickers/_star.png";
import flower from "@/assets/images/stickers/_flower.png";
import korilakuma from "@/assets/images/stickers/_korilakuma.png";

import sushi from "@/assets/images/diary/sushi.png";
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

  return (
    <PageWrapper>
      <div className={styles.diaryPage}>
        <HeaderBox header="Journal" showFlashy={false} />
        <div className={styles.diaryLayout}>
          <aside className={styles.sidebar}>
            <div className={styles.compHeader}>
              <div className={styles.compHeaderRow}>
                <div className={styles.compHeaderTitle}>CLASS SCHEDULE</div>
              </div>
              <div className={styles.compHeaderRow}>
                <div className={styles.compHeaderText}>NAME</div>
                <div className={styles.compHeaderLine}></div>
                <div className={styles.compHeaderText}>ADDRESS</div>
                <div className={styles.compHeaderLine}></div>
              </div>
              <div className={styles.compHeaderRow}>
                <div className={styles.compHeaderText}>SCHOOL</div>
                <div className={styles.compHeaderLine}></div>
                <div className={styles.compHeaderText}>CLASS</div>
                <div className={styles.compHeaderLine}></div>
              </div>
            </div>
            <div className={styles.stickyBox}>
              <div className={styles.filterHeader}>
                <h3>Browse</h3>
                <Button small text="All entries" onClick={clearFilter} />
              </div>
              <ul className={`${styles.yearList} scrollArea`}>
                {Object.keys(index)
                  .map((y) => parseInt(y, 10))
                  .sort((a, b) => b - a)
                  .map((year) => (
                    <li key={year}>
                      <div className={styles.yearRow}>
                        <button
                          className={`${styles.yearBtn} ${selectedYear === year && !selectedMonth ? styles.active : ""}`}
                          onClick={() => handleSelectYear(year)}
                        >
                          {year}
                        </button>
                        <button className={styles.collapseBtn} onClick={() => toggleYearCollapsed(year)}>
                          {collapsedYears[year] ? "+" : "−"}
                        </button>
                      </div>
                      {!collapsedYears[year] && (
                        <ul className={styles.monthList}>
                          {Object.keys(index[year])
                            .map((m) => parseInt(m, 10))
                            .sort((a, b) => b - a)
                            .map((month) => (
                              <li key={month}>
                                <button
                                  className={`${styles.monthBtn} ${selectedYear === year && selectedMonth === month ? styles.active : ""}`}
                                  onClick={() => handleSelectMonth(year, month)}
                                >
                                  {new Date(0, month - 1).toLocaleString('default', { month: 'long' })} ({index[year][month]})
                                </button>
                              </li>
                            ))}
                        </ul>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
            <div className={styles.compFooter}>
              <div className={styles.dimensions}>
              9<sup>1</sup><span>&frasl;</span><sub>4</sub>in. x 7<sup>1</sup><span>&frasl;</span><sub>2</sub>in.
              </div>
              <div className={styles.madeInJapan}>MADE IN JAPAN</div>
            </div>
          </aside>
          <main className={styles.contentPaperContainer}>
            <div className={styles.contentPaper}>
              {loading && <div className={styles.loadingState}>Loading entries...</div>}
              {!loading && error && <div className={styles.errorState}>{error}</div>}
              {!loading && !error && filtered.length === 0 && (
                <div className={styles.emptyState}>No entries yet!</div>
              )}
              {!loading && !error && filtered.length > 0 && (
                <ul className={`${styles.bulletList} scrollArea`}>
                  {filtered.map((entry) => {
                    const date = formatDate(entry.publishedAt);
                    return (
                      <li key={entry.id}>
                        <Link href={`/journal/${entry.slug}`} className={styles.entryLink}>
                          <button className={styles.entryLink}>
                            [{date}] - &quot;{entry.title}&quot;
                          </button>
                        </Link>
                      </li>
                    );
                  })}
                  <div className={styles.heightTest}></div>
                </ul>
              )}
            </div>
          </main>
        </div>
      </div>
      <br />
      <br />
      <Footer />  
    </PageWrapper>
  );
}
