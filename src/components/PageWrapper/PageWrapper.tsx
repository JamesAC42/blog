"use client";

import { ProfilePanel } from "../ProfilePanel/ProfilePanel"
import { VerticalNav } from "../VerticalNav/VerticalNav"
import { Window } from "../Window/Window"
import styles from "./pagewrapper.module.scss"
import { useEffect, useState } from "react"
import Image from "next/image"
import tiktok from "@/assets/images/social media/tiktok.png"
import instagram from "@/assets/images/social media/instagram.png"
import xlogo from "@/assets/images/social media/x.png"
import pinterest from "@/assets/images/social media/pinterest.png"

export interface IPageWrapperProps {
    children: React.ReactNode
}

type ProfileHeader = { headerText?: string; subHeaderText?: string };

let cachedProfile: ProfileHeader | null = null;
let inflight: Promise<ProfileHeader> | null = null;

async function getProfileOnce(): Promise<ProfileHeader> {
    if (cachedProfile) return cachedProfile;
    if (inflight) return inflight;
    inflight = fetch("/api/profile", { cache: "no-store" })
        .then(async (r) => (r.ok ? ((await r.json()) as ProfileHeader) : ({ headerText: "", subHeaderText: "" })))
        .catch(() => ({ headerText: "", subHeaderText: "" }))
        .then((data) => { cachedProfile = data; inflight = null; return data; });
    return inflight;
}

export const PageWrapper = ({ children }: IPageWrapperProps) => {
    const [profile, setProfile] = useState<ProfileHeader | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const data = await getProfileOnce();
            if (mounted) setProfile(data);
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <div className={`pageContainer scrollArea ${styles.pageWrapperContainer}`}>
            <div className={`pageContent`}>
                {children}
            </div>
            <div className={`stickyRight`}>
                <Window header="about" showButtons={true}>
                    <ProfilePanel headerText={profile?.headerText || ""} subHeaderText={profile?.subHeaderText || ""} />
                </Window>
                <VerticalNav />
                <Window>
                    <div className={styles.navFooter}>
                        <div className={styles.copyright}>
                            Copyright © 2025
                        </div>
                        <div className={styles.socialMedia}>
                            <a href="https://github.com/jamescrovo" target="_blank" rel="noopener noreferrer">
                                <Image src={tiktok} alt="github placeholder" />
                            </a>
                            <a href="https://www.linkedin.com/in/jamescrovo" target="_blank" rel="noopener noreferrer">
                                <Image src={instagram} alt="linkedin placeholder" />
                            </a>
                            <a href="https://twitter.com/jamescrovo" target="_blank" rel="noopener noreferrer">
                                <Image src={xlogo} alt="twitter" />
                            </a>
                            <a href="https://www.youtube.com/@jamescrovo" target="_blank" rel="noopener noreferrer">
                                <Image src={pinterest} alt="video placeholder" />
                            </a>
                        </div>
                    </div>
                </Window>
            </div>
        </div>
    )
}
