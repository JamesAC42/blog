import { Button } from "../Button/Button";
import styles from "./window.module.scss";

import close from "@/assets/images/window/close_white.png";
import minimize from "@/assets/images/window/minimize_white.png";
import maximize from "@/assets/images/window/maximize_white.png";
import Image from "next/image";

export const Window = ({
    children,
    header,
    showButtons = false,
    scrollable = false,
    contentClass = ""
}: {children: React.ReactNode, header?: string, showButtons?: boolean, scrollable?: boolean, contentClass?: string}) => {
    return (
        <div className={`${styles.window} windowStyle`}>
            {
                header &&
                <div className={styles.windowHeader}>
                    <div className={styles.windowHeaderText}>{header}</div>
                    {
                        showButtons &&
                        <div className={styles.windowButtons}>
                            <div className={styles.windowButtonContainer}>
                                <Button onClick={() => {}} small={true}>
                                    <Image 
                                        src={minimize} 
                                        alt="minimize" 
                                        width={32} 
                                        height={32} 
                                        className={`${styles.windowButton} ${styles.windowButtonMinimize}`} />
                                </Button>
                            </div>
                            <div className={styles.windowButtonContainer}>
                                <Button onClick={() => {}} small={true}>
                                    <Image 
                                        src={maximize} 
                                        alt="maximize" 
                                        width={32} 
                                        height={32} 
                                        className={styles.windowButton}
                                    />
                                </Button>
                            </div>
                            <div className={styles.windowButtonContainer}>
                                <Button onClick={() => {}} small={true}>
                                    <Image 
                                        src={close} 
                                        alt="close" 
                                        width={32} 
                                        height={32} 
                                        className={styles.windowButton}
                                    />
                                </Button>
                            </div>
                        </div>
                    }
                </div>
            }
            <div className={`${scrollable ? "scrollArea" : ""} ${contentClass}`}>
                {children}
            </div>
        </div>
    )
}