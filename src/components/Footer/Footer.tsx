import styles from "./footer.module.scss";
import { Window } from "../Window/Window";

export const Footer = ({ lastUpdated }: { lastUpdated?: string }) => {
    return (
        <div className={styles.footer}>
            <Window>
                <div className={`windowContent ${styles.footerOuter}`}>
                    <div className={styles.footerContainer}>
                        <p>copyright 2025 jamescrovo.com</p>
                        <p>tuned for wide displays • 1920×1080</p>
                        {
                            lastUpdated && (
                                <p>last updated: {lastUpdated}</p>
                            )
                        }
                        <p>questions? feedback? contact me @ <a href="mailto:jamescrovo450@gmail.com">jamescrovo450@gmail.com</a></p>
                    </div>
                </div>
            </Window>
        </div>
    );
};
