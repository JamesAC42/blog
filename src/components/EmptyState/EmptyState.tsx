"use client";

import styles from "./emptystate.module.scss";

const KAOMOJIS = [
    "(´・ω・`)",
    "(╯°□°）╯",
    "(；・∀・)",
    "(・_・ヾ",
    "(￣ω￣;)",
    "┐(￣ヘ￣)┌",
    "(´-ω-`)",
    "(=｀ω´=)",
];

function getKaomoji(seed?: string): string {
    if (!seed) return KAOMOJIS[0];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    return KAOMOJIS[Math.abs(hash) % KAOMOJIS.length];
}

export interface IEmptyStateProps {
    title: string;
    message?: string;
    seed?: string;
    compact?: boolean;
}

export const EmptyState = ({ title, message, seed, compact = false }: IEmptyStateProps) => {
    const kaomoji = getKaomoji(seed || title);

    return (
        <div className={`${styles.emptyState} ${compact ? styles.compact : ""}`}>
            <div className={styles.terminal}>
                <div className={styles.terminalHeader}>
                    <span className={styles.terminalDot}></span>
                    <span className={styles.terminalDot}></span>
                    <span className={styles.terminalDot}></span>
                    <span className={styles.terminalTitle}>status.exe</span>
                </div>
                <div className={styles.terminalContent}>
                    <div className={styles.kaomoji}>{kaomoji}</div>
                    <div className={styles.textContent}>
                        <p className={styles.title}>&gt; {title}</p>
                        {message && <p className={styles.message}>{message}</p>}
                    </div>
                    <div className={styles.cursor}></div>
                </div>
            </div>
        </div>
    );
};

export default EmptyState;
