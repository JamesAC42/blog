"use client";

import { Button } from "../Button/Button";
import styles from "./journalpanel.module.scss";
import { StickerContainer } from "../StickerContainer/StickerContainer";
import { Window } from "../Window/Window";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import markdownStyles from "@/styles/blogpostmarkdown.module.scss";
import Link from "next/link";

export interface IJournalPanelProps {
    entries: {
        id: string,
        slug: string,
        title: string,
        date: string,
        preview: string,
    }[]
}

const formatDate = (value?: string) => {
    if (!value) {
        return "";
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        return value;
    }
    return d.toLocaleDateString();
};

export const JournalPanel = (props: IJournalPanelProps) => {

    return (
        <Window header="journal" showButtons={true} contentClass={`${styles.diaryWindow} scrollArea`}>
            <div className={'windowContent'}>
                {
                    props.entries.map((entry) => (
                        <div className={styles.diaryEntry} key={entry.id}>
                            <div className={styles.entryHeader}>
                                <h3 className={styles.entryTitle}>{entry.title}</h3>
                                <span className={styles.entryDate}>{formatDate(entry.date)}</span>
                            </div>
                            <div className={styles.entryPreviewContainer}>
                                <div className={`${styles.entryPreview} ${markdownStyles.postContent}`}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                        {entry.preview}
                                    </ReactMarkdown>
                                </div>
                            </div>
                            <div className={styles.diaryButtonContainer}>
                                <Link href={`/diary/${entry.slug || entry.id}`}>
                                <Button small text="Read more" />
                                </Link>
                            </div>

                            <div className={styles.diaryStickerContainer}>
                                <StickerContainer blogId={entry.id} />
                            </div>
                        </div>
                    ))
                }

                {
                    props.entries.length === 0 && (
                        <p className={styles.diaryEmpty}>No journal entries yet!</p>
                    )
                }
            </div>
        </Window>
    )
}
