"use client";

import styles from "./blogpost.module.scss";
import markdownStyles from "@/styles/blogpostmarkdown.module.scss";
import { PageWrapper } from "@/components/PageWrapper/PageWrapper";
import HeaderBox from "@/components/HeaderBox/HeaderBox";
import Image from "next/image";
import calendar from "@/assets/images/icons/calendar.png";
import time from "@/assets/images/icons/time.png";
import heart from "@/assets/images/icons/heart.png";
import heartwhite from "@/assets/images/icons/heartwhite.png";
// import leftarrow from "@/assets/images/icons/left.png";
import eye from "@/assets/images/icons/eye.png";
import comment from "@/assets/images/icons/comment.png";
import share from "@/assets/images/icons/share.png";
import { Window } from "@/components/Window/Window";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Button } from "@/components/Button/Button";
import { Turnstile } from "@marsidev/react-turnstile";
// import { useRouter } from "next/navigation";

import hellokittycomputer from "@/assets/images/blog/hellokittycomputer.png";
import tape from "@/assets/images/blog/tape.png";

import commentBubble from "@/assets/images/blog/comment.png";
import Link from "next/link";

export default function BlogPost() {
    const params = useParams();
    const slug = (params?.slug as string) ?? "";
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [post, setPost] = useState<{ title: string; excerpt?: string | null; publishedAt?: string | null; markdown: string; likes?: number; views?: number, tags?: string[] } | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [liked, setLiked] = useState(false);
    const [liking, setLiking] = useState(false);
    const [comments, setComments] = useState<Array<{ id: string; name: string; email?: string | null; content: string; createdAt: string; isAdmin?: boolean; replies?: Array<{ id: string; content: string; createdAt: string }> }>>([]);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [content, setContent] = useState("");
    const [turnstileToken, setTurnstileToken] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (!slug) return;
        (async () => {
            setLoading(true);
            setError("");
            try {
                const r = await fetch(`/api/blog/${encodeURIComponent(slug)}`, { cache: "no-store" });
                if (!r.ok) throw new Error("Failed to load post");
                const j = await r.json();
                setPost({ title: j.title, excerpt: j.excerpt, publishedAt: j.publishedAt, markdown: j.markdown || "", likes: j.likes, views: j.views, tags: j.tags });
                if (typeof document !== "undefined") {
                    const cookieName = `liked_${encodeURIComponent(slug)}=`;
                    setLiked(document.cookie.split("; ").some(c => c.startsWith(cookieName)));
                }
                // load comments
                const rc = await fetch(`/api/blog/comments?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
                if (rc.ok) {
                    const jc = await rc.json();
                    setComments(jc.items || []);
                }
                // check admin
                const ra = await fetch(`/api/admin/auth/me`, { cache: "no-store" });
                if (ra.ok) {
                    const ja = await ra.json();
                    setIsAdmin(!!ja.isAdmin);
                }
            } catch (e) {
                setError((e as Error).message || "Failed to load");
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    // Increment views once per session and once per mount
    const incrementedRef = useRef(false);
    useEffect(() => {
        if (!slug) return;
        if (incrementedRef.current) return;
        const key = `viewed:${slug}`;
        if (typeof window !== "undefined") {
            const already = sessionStorage.getItem(key);
            if (already) {
                incrementedRef.current = true;
                return;
            }
            sessionStorage.setItem(key, "1");
        }
        incrementedRef.current = true;
        fetch(`/api/blog/view`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) }).catch(() => {});
    }, [slug]);

    const header = post?.title || "Post";
    const subtitle = post?.excerpt || "";
    const date = post?.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "";
    const likes = typeof post?.likes === "number" ? post!.likes : 0;
    const readingTime = post?.markdown ? (() => {
        const words = post.markdown.trim().split(/\s+/).filter(Boolean).length;
        if (!words) return "";
        const minutes = Math.max(1, Math.ceil(words / 200));
        return `${minutes} min read`;
    })() : "";

    const likeOnce = async () => {
        if (!slug || liked || liking) return;
        setLiking(true);
        try {
            const r = await fetch(`/api/blog/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
            if (r.ok) {
                setPost((prev) => prev ? { ...prev, likes: (prev.likes ?? 0) + 1 } : prev);
                setLiked(true);
            } else if (r.status === 429) {
                setLiked(true);
            }
        } finally {
            setLiking(false);
        }
    };

    return (
        <PageWrapper>
            <HeaderBox header={header} subtitle2={subtitle} showFlashy={false}>
                <div className={styles.postDetailsContainer}>
                    <div className={styles.postDetails}>
                        <div className={styles.postDetail}>
                            <Image src={calendar} alt="calendar" width={16} height={16} />
                            <p>{date}</p>
                        </div>
                        <div className={styles.postDetail}>
                            <Image src={time} alt="time" width={16} height={16} />
                            <p>{readingTime}</p>
                        </div>
                        <div className={styles.postDetail}>
                            <Image src={eye} alt="eye" width={16} height={16} />
                            <p>{post?.views} {post?.views === 1 ? "view" : "views"}</p>
                        </div>
                        <div className={styles.postDetail}>
                            <Image src={heart} alt="likes" width={16} height={16} />
                            <p>{likes}</p>
                        </div>
                    </div>
                    <br/>
                    <Link href="/blog" className={styles.backToAllPosts}>
                    <Button small text="Back to all posts" />
                    </Link>
                </div>
                <div className={styles.postActions}>
                    <div className={`${styles.postAction} ${liked ? styles.liked : ""}`} onClick={likeOnce}>
                        {
                            liked ?
                            <Image src={heartwhite} alt="heart" width={16} height={16} />
                            :
                            <Image src={heart} alt="heart" width={16} height={16} />
                        }
                    </div>
                    <div className={styles.postAction} onClick={() => {
                        commentTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        setTimeout(() => commentTextareaRef.current?.focus(), 300);
                    }}>
                        <Image src={comment} alt="comment" width={16} height={16} />
                    </div>
                    <div className={styles.postAction} onClick={async () => {
                        try {
                            const url = typeof window !== "undefined" ? window.location.href : "";
                            const title = post?.title ?? "Blog post";
                            const text = post?.excerpt ?? "";
                            const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { share?: (data: ShareData) => Promise<void>; clipboard?: Clipboard }) : undefined;
                            if (nav?.share) {
                                await nav.share({ title, text, url });
                            } else if (nav?.clipboard && url) {
                                await nav.clipboard.writeText(url);
                                alert("Link copied to clipboard");
                            } else {
                                prompt("Copy this link:", url);
                            }
                        } catch {}
                    }}>
                        <Image src={share} alt="share" width={16} height={16} />
                    </div>
                </div>
            </HeaderBox>
            <br/>
            <div className={styles.postTags}>
                Tags: 
                {post?.tags?.map((t) => (
                    <a
                        href={`/blog?tags=${t}&sort=newest&page=1&pageSize=9`}
                        className={styles.postTag} key={t}>{t}</a>
                ))}
            </div>
            <div className={styles.postContent}>
                <Image className={styles.tapeTop} src={tape} alt="tape" width={412} height={123} />
                <Image className={styles.tapeBottom} src={tape} alt="tape" width={412} height={123} />
                <div className={`${markdownStyles.postContent}`}>
                    {loading && <p>Loading…</p>}
                    {error && <p>{error}</p>}
                    {!loading && !error && (
                        <>
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                {post?.markdown ?? ""}
                            </ReactMarkdown>
                        </>
                    )}
                </div>
                <br/>
                <Image className={styles.helloKittyComputer} src={hellokittycomputer} alt="post image" width={480} height={480} />
            </div>
            <br/>
            <Window header="Comments" showButtons={true}>
                <div className={styles.commentsOuter}>
                    <div className={styles.commentsList}>
                        {comments.map((c) => (
                            <div key={c.id} className={`${styles.comment} ${c.isAdmin ? styles.adminComment : ""}`}>
                                <div className={styles.commentMeta}>
                                    <div className={styles.commentName}>{c.isAdmin ? "James" : c.name}</div>
                                    <div className={styles.commentTimestamp}>{new Date(c.createdAt).toLocaleString()}</div>
                                </div>
                                <div className={styles.commentComment}>{c.content}</div>
                                {c.replies?.map((r) => (
                                    <div key={r.id} className={`${styles.comment} ${styles.commentReply}`}>
                                        <div className={styles.commentMeta}>
                                            <div className={styles.commentReplyLabel}>Reply on</div>
                                            <div className={styles.commentTimestamp}>{new Date(r.createdAt).toLocaleString()}:</div>
                                        </div>
                                        <div className={styles.commentComment}>{r.content}</div>
                                        {isAdmin && (
                                            <div className={styles.commentActions}>
                                                <Button text="Delete" onClick={async () => {
                                                    if (confirm("Are you sure you want to delete this comment?")) {
                                                    await fetch(`/api/blog/comments?id=${encodeURIComponent(r.id)}`, { method: "DELETE" });
                                                        const rc = await fetch(`/api/blog/comments?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
                                                        if (rc.ok) { const jc = await rc.json(); setComments(jc.items || []); }
                                                    }
                                                }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {
                                    isAdmin && (
                                        <div className={styles.commentActions}>
                                            {isAdmin && (
                                                <Button text="Reply" onClick={async () => {
                                                    const reply = prompt("Reply:") || "";
                                                    if (!reply.trim()) return;
                                                    await fetch(`/api/blog/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, name: "Admin", email: "", content: reply.slice(0, 2000), parentId: c.id, turnstileToken: "dummy" }) });
                                                    const rc = await fetch(`/api/blog/comments?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
                                                    if (rc.ok) { const jc = await rc.json(); setComments(jc.items || []); }
                                                }} />
                                            )}
                                            {isAdmin && (
                                                <Button text="Delete" onClick={async () => {
                                                    if (confirm("Are you sure you want to delete this comment?")) {
                                                    await fetch(`/api/blog/comments?id=${encodeURIComponent(c.id)}`, { method: "DELETE" });
                                                        const rc = await fetch(`/api/blog/comments?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
                                                        if (rc.ok) { const jc = await rc.json(); setComments(jc.items || []); }
                                                    }
                                                }} />
                                            )}
                                        </div>
                                    )
                                }
                            </div>
                        ))}
                    </div>
                    <div className={styles.commentsFormOuter}>
                        <div className={styles.commentsFormHeader}>
                            <h3>Leave a comment!</h3>
                        </div>
                        <div className={styles.commentsForm}>
                            <label>Name</label> <input type="text" value={name} onChange={(e) => setName(e.target.value.slice(0, 64))} />
                            <label>Email (optional, only visible to site owner)</label> <input type="email" value={email} onChange={(e) => setEmail(e.target.value.slice(0, 200))} />
                            <label>Comment</label> <textarea ref={commentTextareaRef} value={content} onChange={(e) => setContent(e.target.value.slice(0, 2000))} />
                            <div className={styles.commentsFormButton}>
                                <Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string} onSuccess={(t) => setTurnstileToken(t)} />
                                
                                <Button text="Submit" onClick={async () => {
                                    if (!name.trim() || !content.trim()) { alert("Please enter your name and comment"); return; }
                                    setSubmitting(true);
                                    try {
                                        const r = await fetch(`/api/blog/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, name: name.trim(), email: email.trim(), content: content.trim(), turnstileToken }) });
                                        if (!r.ok) { alert("Failed to submit comment"); return; }
                                        setName(""); setEmail(""); setContent(""); setTurnstileToken("");
                                        const rc = await fetch(`/api/blog/comments?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
                                        if (rc.ok) { const jc = await rc.json(); setComments(jc.items || []); }
                                    } finally { setSubmitting(false); }
                                }} disabled={submitting || (!isAdmin && !turnstileToken)} />
                            </div>
                        </div>
                        <div className={styles.commentsFormImage}>
                            <Image src={commentBubble} alt="comment bubble" />
                        </div>
                    </div>
                </div>
            </Window>
        </PageWrapper>
    )
}
