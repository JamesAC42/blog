"use client";

import HeaderBox from "@/components/HeaderBox/HeaderBox";
import { PageWrapper } from "@/components/PageWrapper/PageWrapper";
import { useEffect, useMemo, useState } from "react";
// import { Window } from "@/components/Window/Window";
import Image from "next/image";
import { Button } from "@/components/Button/Button";
import styles from "./scrapbook.module.scss";

import open from "@/assets/images/icons/open.png";
import { computeTilt } from "@/utilities/computeTilt";
import { Footer } from "@/components/Footer/Footer";

type ScrapbookItem = { id: string; imageUrl: string; caption: string; takenAt?: string | null; album?: string | null; tags?: string[] };

function computeTiltClass(item: ScrapbookItem): string {
    const key = (item.id || item.imageUrl || "");
    const n = computeTilt(key);
    return `tilt${n}`;
}

function PolaroidCard({ item, index, focused, onClick }: {
    item: ScrapbookItem;
    index: number;
    focused: boolean;
    onClick: (e: React.MouseEvent<HTMLDivElement>, item: ScrapbookItem, index?: number) => void;
}) {


    const handleOpen = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        window.open(item.imageUrl, '_blank');
    };

    return (
        <div
            className={`${styles.polaroid} ${styles[computeTiltClass(item)]} ${focused ? styles.polaroidFocused : ""}`}
            onClick={(e) => onClick(e, item, index)}
            style={{ "--delay": `${index * 0.1}s` } as React.CSSProperties}
        >
            <Image src={item.imageUrl} alt={item.caption} className={styles.polaroidImage} width={800} height={600} />
            <div className={`${styles.polaroidCaption}`}>
                <div className={styles.cardTitle}>{item.caption}</div>
                <div className={styles.cardDate}>{item.takenAt ? new Date(item.takenAt).toLocaleDateString() : ""}</div>
            </div>
            <div 
                className={styles.polaroidOpen}
                onClick={(e) => handleOpen(e)}
                >
                <Image src={open} alt="Open" />
            </div>
        </div>
    );
}

function PolaroidList({ items, focusedId, onCardClick }: {
    items: ScrapbookItem[];
    focusedId: string | null;
    onCardClick: (e: React.MouseEvent<HTMLDivElement>, item: ScrapbookItem, index?: number) => void;
}) {
    return (
        <>
            {items.map((it, idx) => (
                <PolaroidCard key={it.id} item={it} index={idx} focused={focusedId === it.id} onClick={onCardClick} />
            ))}
        </>
    );
}

function PaginationControls({ page, total, onPrev, onNext }: {
    page: number;
    total?: number;
    onPrev: () => void;
    onNext: () => void;
}) {
    const totalPages = total != null ? Math.max(1, Math.ceil(total / 12)) : undefined;
    return (
        <div className={styles.paginationBar}>
            <div className={styles.buttonRow}>
                <Button onClick={onPrev} disabled={page <= 1}>{"< Prev"}</Button>
                {totalPages != null ? (
                    <span>Page {page} / {totalPages}</span>
                ) : (
                    <span>Page {page}</span>
                )}
                <Button onClick={onNext} disabled={totalPages != null ? page >= totalPages : false}>{"Next >"}</Button>
            </div>
        </div>
    );
}

export default function Scrapbook() {
    const [items, setItems] = useState<Array<ScrapbookItem>>([]);
    const [albums, setAlbums] = useState<Array<string>>([]);
    const [album, setAlbum] = useState<string>("");
    const [tagFilter, setTagFilter] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [total, setTotal] = useState<number>(0);
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [gridClass, setGridClass] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [focusedAlbumKey, setFocusedAlbumKey] = useState<string | null>(null);

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>, item: ScrapbookItem) => {
        if (focusedId === item.id) {
            setFocusedId(null);
            setGridClass("");
            setFocusedAlbumKey(null);
            return;
        }
        const card = (e.currentTarget as HTMLDivElement);
        const rect = card.getBoundingClientRect();
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        const dx = viewportCenterX - cardCenterX;
        const dy = viewportCenterY - cardCenterY;
        card.style.setProperty("--dx", `${dx}px`);
        card.style.setProperty("--dy", `${dy}px`);
        setFocusedId(item.id);
        setGridClass(styles.gridDim);
    };

    // Load list of albums once; do not derive from filtered items
    useEffect(() => {
        (async () => {
            try {
                const r = await fetch("/api/scrapbook/albums", { cache: "no-store" });
                if (r.ok) {
                    const j = await r.json();
                    const arr = Array.isArray(j.albums) ? j.albums as string[] : [];
                    const sorted = [...arr].sort((a, b) => a.localeCompare(b));
                    setAlbums(sorted);
                }
            } catch {}
        })();
    }, []);

    useEffect(() => {
        setLoading(true);
        (async () => {
            // If tag filter is active, ignore album and paginate across entire table client-side
            if (tagFilter.trim()) {
                const params = new URLSearchParams();
                params.set("page", "1");
                params.set("pageSize", String(2000));
                const r = await fetch(`/api/scrapbook?${params.toString()}`, { cache: "no-store" });
                if (r.ok) {
                    const j = await r.json();
                    const tags = tagFilter.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
                    const allItems = (j.items || []) as ScrapbookItem[];
                    const filtered = allItems.filter((it) => {
                        const its = Array.isArray(it.tags) ? it.tags.map(s => s.toLowerCase()) : [];
                        return tags.length === 0 ? true : tags.some(t => its.includes(t));
                    });
                    const start = (page - 1) * 12;
                    const end = start + 12;
                    setItems(filtered.slice(start, end));
                    setTotal(filtered.length);
                }
                setLoading(false);
                return;
            }

            // Album mode: if album selected, paginate; else fetch initial chunk
            if (album) {
                const params = new URLSearchParams();
                params.set("album", album);
                params.set("page", String(page));
                params.set("pageSize", String(12));
                const r = await fetch(`/api/scrapbook?${params.toString()}`, { cache: "no-store" });
                setLoading(false);
                if (r.ok) { const j = await r.json(); setItems(j.items || []); setTotal(j.total || 0); }
            } else {
                const params = new URLSearchParams();
                params.set("page", "1");
                params.set("pageSize", "200");
                const r = await fetch(`/api/scrapbook?${params.toString()}`, { cache: "no-store" });
                if (r.ok) {
                    const j = await r.json();
                    setItems(j.items || []);
                    setTotal(j.total || 0);
                }
                setLoading(false);
            }
        })();
    }, [album, tagFilter, page]);

    // When focused, clicking anywhere outside a polaroid clears focus
    useEffect(() => {
        if (!focusedId) return;
        const onDocClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && target.closest && target.closest(`.${styles.polaroid}`)) {
                return;
            }
            setFocusedId(null);
            setGridClass("");
            setFocusedAlbumKey(null);
        };
        document.addEventListener("click", onDocClick);
        return () => {
            document.removeEventListener("click", onDocClick);
        };
    }, [focusedId]);

    const groups = useMemo(() => {
        const byAlbum: Record<string, typeof items> = {};
        for (const it of items) {
            const label = (it.album && it.album.trim().length > 0) ? it.album : "Uncategorized";
            byAlbum[label] = byAlbum[label] || [];
            byAlbum[label].push(it);
        }
        return byAlbum;
    }, [items]);

    // Tags list can be computed if needed later

    return (
        <PageWrapper>
            <HeaderBox header="Gallery" showFlashy={false}/>
            <div className={`windowStyle ${styles.filterBar}`}>
                <div className={styles.filterRow}>
                    <label className={styles.filterLabel}>
                        <span>Album:</span>
                        <select value={album} onChange={(e) => { setAlbum(e.target.value); setPage(1); }} className={`${styles.select}`}>
                            <option value="">All</option>
                            <option value="__null__">Uncategorized</option>
                            {albums.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </label>
                    <label className={styles.filterLabel}>
                        <span>Tags (comma-separated):</span>
                        <input value={tagFilter} onChange={(e) => { setTagFilter(e.target.value); setPage(1); }} className={`${styles.input}`} placeholder="e.g. food, cool bugs" />
                    </label>
                </div>
            </div>
            {tagFilter.trim() && (
                <>
                    {items.length === 0 ? (
                        <div className={`${styles.loadingContainer} windowStyle`}>No pictures match these tags.</div>
                    ) : (
                        <div className={`${styles.grid} ${gridClass}`}>
                            <PolaroidList
                                items={items}
                                focusedId={focusedId}
                                onCardClick={(e, item) => {
                                    setFocusedAlbumKey("__tags__");
                                    handleCardClick(e, item);
                                }}
                            />
                        </div>
                    )}
                </>
            )}
            {tagFilter.trim() && (
                <PaginationControls page={page} total={total} onPrev={() => setPage(Math.max(1, page - 1))} onNext={() => setPage(page + 1)} />
            )}
            

            {!tagFilter.trim() && album && (
                <>
                    {items.length === 0 ? (
                        <div className={`${styles.loadingContainer} windowStyle`}>No pictures to display here.</div>
                    ) : (
                        <div className={`${styles.grid} ${styles.mt1} ${focusedId ? styles.gridDim : ""}`}>
                            <PolaroidList
                                items={items}
                                focusedId={focusedId}
                                onCardClick={(e, item) => {
                                    setFocusedAlbumKey(album);
                                    handleCardClick(e, item);
                                }}
                            />
                        </div>
                    )}
                    <PaginationControls page={page} total={total} onPrev={() => setPage(Math.max(1, page - 1))} onNext={() => setPage(page + 1)} />
                </>
            )}

            {!tagFilter.trim() && !album && (
                Object.entries(groups).map(([alb, imgs]) => {
                    const top3 = imgs.slice(0, 3);
                    return (
                        <div key={alb} className={styles.mb2}>
                            <h2 className={styles.albumHeader}>{alb}</h2>
                            <div className={`${styles.grid} ${styles.mt1} ${focusedId && focusedAlbumKey === alb ? styles.gridDim : ""}`}>
                                <PolaroidList
                                    items={top3}
                                    focusedId={focusedId}
                                    onCardClick={(e, item) => {
                                        setFocusedAlbumKey(alb);
                                        handleCardClick(e, item);
                                    }}
                                />
                                {imgs.length > 3 && (
                                    <div onClick={() => { setAlbum(alb === "Uncategorized" ? "__null__" : alb); setPage(1); setFocusedId(null); setFocusedAlbumKey(null); setGridClass(""); }}  className={styles.seeAllCell}>
                                        <div className={styles.buttonInner}>
                                            View All &gt;
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}

            {loading && (
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingContent}>
                        <div className={styles.loadingText}>
                            <h1>Loading...</h1>
                        </div>
                    </div>
                </div>
            )}
            <br />
            <Footer />
        </PageWrapper>
    )
}