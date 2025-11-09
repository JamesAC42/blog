import styles from "./blogpanel.module.scss";
import { Button } from "../Button/Button";
import { Window } from "../Window/Window";
import Image from "next/image";
import { useRouter } from "next/navigation";
import sheep from "@/assets/images/homepage/sheep.gif";
import sailormoonstamp from "@/assets/images/stamps/sailormoon.png";

export interface IBlogPost {
    id: string;
    title: string;
    content: string;
    date: string;
    tags: string[];
}

export interface IBlogPanelProps {
    recentPosts: IBlogPost[];
    popularPosts: IBlogPost[];
}

export const BlogPanel = (props: IBlogPanelProps) => {
    const router = useRouter();
    const goToTag = (tag: string) => {
        const q = new URLSearchParams({ tags: tag });
        router.push(`/blog?${q.toString()}`);
    };
    const goToPost = (id: string) => {
        router.push(`/blog/${encodeURIComponent(id)}`);
    };

    // console.log(props);

    return (
        <div className={`windowContent ${styles.blogPostContainer} scrollArea`}>
            <div className={styles.blogInfo}>
                <div className={styles.blogCategories}>
                    <Button text="coding" onClick={() => goToTag("Coding")} />
                    <Button text="math" onClick={() => goToTag("Math")} />
                    <Button text="music" onClick={() => goToTag("Music")} />
                    <Button text="language" onClick={() => goToTag("Language")} />
                    <Button text="philosophy" onClick={() => goToTag("Philosophy")} />
                    <Button text="religion" onClick={() => goToTag("Life")} />
                </div>

                </div>
                <div className={styles.blogContent}>
                <div className={styles.blogSection}>
                    <div className={styles.blogCategoryTitle}>
                        <h2>recent posts</h2>
                    </div>

                    {props.recentPosts.length > 0 && props.recentPosts.map((post) => {
                        const preview = (post.content || "").trim();
                        const short = preview.length > 180 ? `${preview.slice(0, 180)}…` : preview;
                        return (
                            <div className={styles.blogItem} key={post.id} onClick={() => goToPost(post.id)}>
                                <h3>
                                    <span className={styles.blogTitle}>{post.title}</span>
                                    <span className={styles.blogDate}>{post.date}</span>
                                </h3>
                                <div className={styles.blogTags}>
                                    {(post.tags || []).slice(0, 5).map((t) => (
                                        <span key={t} className={styles.blogTag} onClick={(e) => { e.stopPropagation(); goToTag(t); }}>{t}</span>
                                    ))}
                                </div>
                                <p>{short}</p>
                            </div>
                        );
                    })}

                    {
                        props.recentPosts.length === 0 && (
                            <div className={styles.noPosts}>
                                <p>No recent posts</p>
                            </div>
                        )
                    }
                </div>
                <div className={styles.blogSection}>
                    <div className={styles.blogCategoryTitle}>
                        <h2>popular posts</h2>
                    </div>
                    
                    {props.popularPosts.length > 0 && props.popularPosts.map((post) => {
                        const preview = (post.content || "").trim();
                        const short = preview.length > 180 ? `${preview.slice(0, 180)}…` : preview;
                        return (
                            <div className={styles.blogItem} key={post.id} onClick={() => goToPost(post.id)}>
                                <h3>
                                    <span className={styles.blogTitle}>{post.title}</span>
                                    <span className={styles.blogDate}>{post.date}</span>
                                </h3>
                                <div className={styles.blogTags}>
                                    {(post.tags || []).slice(0, 5).map((t) => (
                                        <span key={t} className={styles.blogTag} onClick={(e) => { e.stopPropagation(); goToTag(t); }}>{t}</span>
                                    ))}
                                </div>
                                <p>{short}</p>
                            </div>
                        );
                    })}

                    {
                        props.popularPosts.length === 0 && (
                            <div className={styles.noPosts}>
                                <p>No popular posts</p>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    );
}