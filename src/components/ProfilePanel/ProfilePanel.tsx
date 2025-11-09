import styles from "./profilepanel.module.scss";
import Image from "next/image";
import profile from "@/assets/images/homepage/profile.jpg";
import japanflag from "@/assets/images/flags/japan.png";
import koreaflag from "@/assets/images/flags/korea.png";
import usaflag from "@/assets/images/flags/usa.png";

export interface IProfilePanelProps {
    headerText?: string;
    subHeaderText?: string;
}

export const ProfilePanel = (data: IProfilePanelProps) => {
    return (
        <div className={`windowContent ${styles.aboutMe}`}>
          <div className={styles.profilePictureContainer}>
              <Image src={profile} alt="profile" className={styles.profileImage} />
          </div>
          <p className={styles.hi}>{data.headerText}</p>
          <p className={styles.subHeaderText}>{data.subHeaderText}</p>
          <p className={styles.languages}>Languages:</p>
          <p className={styles.flags}>
            <Image src={japanflag} alt="japan" width={40} height={40} />
            <Image src={koreaflag} alt="korea" width={40} height={40} />
            <Image src={usaflag} alt="usa" width={40} height={40} />
          </p>
        </div>
    );
};
