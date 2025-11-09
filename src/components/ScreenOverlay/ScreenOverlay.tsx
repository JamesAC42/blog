"use client";

import styles from "./screenoverlay.module.scss";

import monitor from "@/assets/images/icons/monitor.png";
import laptop from "@/assets/images/icons/laptop.png";
import sadKitty from "@/assets/images/sadhellokitty.png";

import Image from "next/image";
import { usePathname } from "next/navigation";

export const ScreenOverlay = () => {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith("/admin") ?? false;

    if (isAdminRoute) {
        return null;
    }

    return (
        <div className={styles.smallScreenOverlay}>
          <div className={`${styles.smallScreenOverlayBox} windowStyle`}>
            <div className={styles.screenImages}>
              <Image src={monitor} alt="screen images" width={100} height={100} />
              <Image src={laptop} alt="screen images" width={100} height={100} />
            </div>
            <h1>Desktop/Laptop Only</h1>
            <Image src={sadKitty} alt="sad kitty" width={100} height={100} />
            <p>
              This site is optimized for desktop and laptop resolutions.
              Please visit on a larger screen to continue.
            </p>
          </div>
        </div>
    )
}