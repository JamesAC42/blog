"use client";

import { Button } from "@/components/Button/Button";
import styles from "./page.module.scss";
import HeaderBox from "@/components/HeaderBox/HeaderBox";
import { PageWrapper } from "@/components/PageWrapper/PageWrapper";
import { Window } from "@/components/Window/Window";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useRef, Suspense } from "react";

import magnifyingglass from "@/assets/images/icons/magnifyingglass.png";

import magazine from "@/assets/images/blog/magazine cover.jpg";
import magazine2 from "@/assets/images/blog/magazine cover 2.jpg";
import magazine3 from "@/assets/images/blog/magazine cover 3.jpg";

import calendar from "@/assets/images/icons/calendar.png";
import eye from "@/assets/images/icons/eye.png";
// removed unused icons

import kumabubble from "@/assets/images/blog/kumabubble.png";
import Link from "next/link";
import { Footer } from "@/components/Footer/Footer";

type SortOption = "newest" | "oldest" | "popular" | "liked";

type BlogListItem = { id: string; slug: string; title: string; excerpt?: string | null; tags: string[]; coverImage?: string | null; publishedAt?: string | null; isFeatured?: boolean | null; views?: number; likes?: number };

const PostItem = ({ item, onClick, featured }: { item: BlogListItem; onClick: () => void; featured: boolean }) => {
    const thumbnail = item.coverImage || [magazine.src, magazine2.src, magazine3.src][Math.floor(Math.random() * 3)];
    return (
        <div className={`${styles.post} windowStyle ${featured ? styles.mainFeaturedPost : ""}`} onClick={onClick}>
            <div className={styles.postImage}>
                <Image src={thumbnail} alt="featured post" width={450} height={610} />
            </div>
            <div className={styles.postContent}>
                <h3>{item.title}</h3>
                {item.excerpt && <h4>{item.excerpt}</h4>}
                <div className={styles.postDate}>
                    <Image src={calendar} alt="calendar" width={16} height={16} />
                    <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ""}</span>
                </div>
                
                {(typeof item.views === "number" || typeof item.likes === "number") && (
                <div className={styles.postDetails}>
                    {typeof item.views === "number" && (
                    <div className={styles.postViews}>
                        <Image src={eye} alt="eye" width={16} height={16} />
                        <span>{item.views} {item.views === 1 ? "view" : "views"}</span>
                    </div>)}
                    {typeof item.likes === "number" && (
                    <div className={styles.postLikes}>
                        <span>❤ {item.likes}</span>
                    </div>)}
                </div>)}
                <div className={styles.postTags}>
                    {(item.tags || []).slice(0, 5).map((t) => (
                        <div className={styles.postTag} key={t}>{t}</div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function BlogContent() {

    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const initialTags = (() => {
        const t = searchParams.get("tags") || "";
        return Array.from(new Set(t.split(",").map((s) => s.trim()).filter(Boolean)));
    })();
    const [activeTags, setActiveTags] = useState<string[]>(initialTags);
    const [sort, setSort] = useState<SortOption>("newest");
    const [page, setPage] = useState(1);
    const pageSize = 9;
    const [featured, setFeatured] = useState<BlogListItem | null>(null);
    const [items, setItems] = useState<BlogListItem[]>([]);
    const [total, setTotal] = useState(0);

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (activeTags.length) params.set("tags", activeTags.join(","));
        if (sort) params.set("sort", sort);
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        return params.toString();
    }, [search, activeTags, sort, page]);

    const tagsQuery = searchParams.get("tags") || "";
    const searchQuery = searchParams.get("search") || "";
    const sortQuery = (searchParams.get("sort") as SortOption) || "newest";
    const pageQuery = Number(searchParams.get("page") || 1) || 1;
    useEffect(() => {
        // Sync state from URL
        const parsedTags = Array.from(new Set(tagsQuery.split(",").map((s) => s.trim()).filter(Boolean)));
        const sameTags = parsedTags.length === activeTags.length && parsedTags.every((t) => activeTags.includes(t));
        if (!sameTags) setActiveTags(parsedTags);
        if (search !== searchQuery) setSearch(searchQuery);
        if (sort !== sortQuery) setSort(sortQuery);
        if (page !== pageQuery) setPage(Math.max(1, pageQuery));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tagsQuery, searchQuery, sortQuery, pageQuery]);

    const fetchedFeaturedRef = useRef(false);
    useEffect(() => {
        if (fetchedFeaturedRef.current) return;
        fetchedFeaturedRef.current = true;
        (async () => {
            const rf = await fetch(`/api/blog/posts?featured=1&page=1&pageSize=1`, { cache: "no-store" });
            if (rf.ok) {
                const jf = await rf.json();
                setFeatured(jf.items?.[0] ?? null);
            }
        })();
    }, []);

    const lastQueryRef = useRef<string>("");
    useEffect(() => {
        if (lastQueryRef.current === queryString) return;
        lastQueryRef.current = queryString;
        (async () => {
            const r = await fetch(`/api/blog/posts?${queryString}`, { cache: "no-store" });
            if (r.ok) {
                const j = await r.json();
                setItems(j.items || []);
                setTotal(j.total || 0);
            }
        })();
    }, [queryString]);

    // Push current filters to URL when user changes state
    const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pushQueryToUrl = (next?: Partial<{ search: string; activeTags: string[]; sort: SortOption; page: number }>) => {
        const q = new URLSearchParams();
        const s = (next?.search ?? search).trim();
        const t = next?.activeTags ?? activeTags;
        const so = next?.sort ?? sort;
        const p = next?.page ?? page;
        if (s) q.set("search", s);
        if (t.length) q.set("tags", t.join(","));
        if (so) q.set("sort", so);
        q.set("page", String(p));
        q.set("pageSize", String(pageSize));
        const qs = q.toString();
        const url = qs ? `/blog?${qs}` : "/blog";
        if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
        pushTimerRef.current = setTimeout(() => {
            router.push(url);
        }, 0);
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return (
        <PageWrapper>
            <HeaderBox header="Blog" subtitle2="Find beauty advice, tea party tips, and more! Enjoy~" showFlashy={false}/>

            <div className={styles.blogSection}>
                <div className={styles.featuredPosts}>
                    <Window>
                        <div className={styles.featuredPostsTitle}>
                            <h2>Featured Post</h2>
                        </div>
                    </Window>
                    <div className={styles.featuredPostsList}>
                        {featured && (
                            <Link href={`/blog/${featured.slug}`} className={styles.postLink}>
                            <PostItem item={featured} featured={true} onClick={() => {}} />
                            </Link>
                        )}
                        <div className={styles.kumabubbleContainer}>
                            <Image src={kumabubble} alt="kumabubble" width={500} height={500} className={styles.kumabubble} />
                        </div>
                    </div>
                </div>
                <div className={styles.filterOuter}>
                    <div className={styles.searchContainer}>
                        <input type="text" placeholder="Search..." value={search} onChange={(e) => { const v = e.target.value; setSearch(v); pushQueryToUrl({ search: v, page: 1 }); }} />
                        <div className={styles.searchIconContainer}>
                            <Image
                                className={styles.searchIcon}
                                src={magnifyingglass} 
                                alt="search" 
                                width={66} 
                                height={66} />
                        </div>
                    </div>
                    <div className={styles.tagsContainer}>
                        {(["All", "Music", "Art", "Life", "Gyaru", "Language", "Gaming", "Cooking", "Health", "Beauty", "Fashion"]).map((t) => {
                            const isAll = t === "All";
                            const tValue = t.toLowerCase();
                            const active = isAll ? activeTags.length === 0 : activeTags.includes(tValue);
                            return (
                                <div key={t} className={`${styles.tag} ${active ? styles.activeTag : ""}`}
                                    onClick={() => {
                                        const prev = activeTags;
                                        const next = isAll ? [] : (prev.includes(tValue) ? prev.filter((x) => x !== tValue) : [...prev, tValue]);
                                        pushQueryToUrl({ activeTags: next, page: 1 });
                                    }}
                                >{t}</div>
                            );
                        })}
                    </div>
                    <div className={styles.sortContainer}>
                        <div className={styles.sortTitle}>Sort:</div>
                        <Button text="Newest" onClick={() => { pushQueryToUrl({ sort: "newest", page: 1 }); }} />
                        <Button text="Oldest" onClick={() => { pushQueryToUrl({ sort: "oldest", page: 1 }); }} />
                        <Button text="Popular" onClick={() => { pushQueryToUrl({ sort: "popular", page: 1 }); }} />
                        <Button text="Liked" onClick={() => { pushQueryToUrl({ sort: "liked", page: 1 }); }} />
                    </div>
                </div>
            </div>
            <div className={styles.blogPostsSection}>
                <Window>
                    <div className={styles.blogPostsTitle}>
                        <h2>Blog Posts</h2>
                        <h4>Category: {activeTags.length ? activeTags.join(", ") : "All"} | Sort: {sort[0].toUpperCase() + sort.slice(1)}</h4>
                    </div>
                </Window>
                <div className={styles.blogPosts}>
                    {items.map((it) => (
                        <Link href={`/blog/${it.slug}`} key={it.id} className={styles.postLink}>
                            <PostItem featured={false} item={it} onClick={() => {}} />
                        </Link>
                    ))}
                </div>
                <div className={styles.pagination}>
                    <Button text="< Previous" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} />
                    <span style={{ margin: "0 0.5rem" }}>{page} / {totalPages}</span>
                    <Button text="Next >" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
                </div>
            </div>
            <br />
            <Footer />
        </PageWrapper>
    )
}

export default function Blog() {
    return (
        <Suspense fallback={<PageWrapper><div className={styles.blogSection}><div>Loading…</div></div></PageWrapper>}>
            <BlogContent />
        </Suspense>
    );
}