import styles from "./progressbar.module.scss";

export const ProgressBar = ({ progress }: { progress: number }) => {
    return (
        <div className={styles.progressBarContainer}>
            <div className={styles.progressBar}>
                <div className={styles.progressBarFill} style={{ width: `${progress}%` }}></div>
            </div>
            <div className={styles.progressBarText}>{progress}%</div>
        </div>
    );
};