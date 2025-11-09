"use client";

import localStyles from "./aboutme.module.scss";

import HeaderBox from "@/components/HeaderBox/HeaderBox";
import { PageWrapper } from "@/components/PageWrapper/PageWrapper";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import markdownStyles from "@/styles/blogpostmarkdown.module.scss";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer/Footer";

export default function AboutMe() {
    const [markdown, setMarkdown] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    //

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");
            try {
                const r = await fetch("/api/aboutme", { cache: "no-store" });
                if (!r.ok) throw new Error("Failed to load");
                const j = await r.json();
                setMarkdown(j.markdown || "");
            } catch (e) {
                setError((e as Error).message || "Failed to load");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // no-op

    return (
        <PageWrapper>
            <HeaderBox header="About Me" subtitle2="" showFlashy={false} />
            <div className={localStyles.aboutWrapper}>
                <div className={`${localStyles.contentCard} ${markdownStyles.postContent}`}>
                    {loading && <p>Loading…</p>}
                    {error && <p>{error}</p>}
                    {!loading && !error && (
                        <div className={localStyles.markdown}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                {markdown}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>  
            </div>
            <br />
            <Footer />
        </PageWrapper>
    )
}