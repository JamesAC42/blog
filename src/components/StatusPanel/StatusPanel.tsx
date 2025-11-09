import styles from "./statuspanel.module.scss";

import Image from "next/image";
import peashooter from "@/assets/images/homepage/peashooter.gif";

export type IStatusPanelData = object;

export const StatusPanel = (props: {data: IStatusPanelData}) => {
    return (
        <div className={`windowContent`}>
            {Object.entries(props.data).map(([key, value]) => (
                <p key={key} className={styles.statusItem}><span className={styles.bold}>{key}:</span> {value}</p>
            ))}
            <div className={styles.peashooterContainer}>
                <Image src={peashooter} className={styles.peashooter} unoptimized={true} alt="peashooter" width={100} height={100} />
            </div>
        </div>
    );
};