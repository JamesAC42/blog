"use client";

import { ProfilePanel } from "../ProfilePanel/ProfilePanel"
import { VerticalNav } from "../VerticalNav/VerticalNav"
import { Window } from "../Window/Window"
import styles from "./pagewrapper.module.scss"
import { useEffect, useState } from "react"
import Image from "next/image"
import xlogo from "@/assets/images/social media/x.png";
import email from "@/assets/images/social media/email.png";
import linkedin from "@/assets/images/social media/linkedin.png";
import github from "@/assets/images/social media/github.png";

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
    const currentYear = new Date().getFullYear();

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
                            Copyright © {currentYear}
                        </div>
                        <div className={styles.socialMedia}>
                            <a href="https://github.com/jamesac42" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile" title="GitHub">
                                <Image src={github} alt="" aria-hidden="true" />
                            </a>
                            <a href="https://www.linkedin.com/in/jamescrovo" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile" title="LinkedIn">
                                <Image src={linkedin} alt="" aria-hidden="true" />
                            </a>
                            <a href="https://twitter.com/fifltriggi" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter) profile" title="X (Twitter)">
                                <Image src={xlogo} alt="" aria-hidden="true" />
                            </a>
                            <a href="mailto:jamescrovo450@gmail.com" target="_blank" rel="noopener noreferrer" aria-label="Send email" title="Email">
                                <Image src={email} alt="" aria-hidden="true" />
                            </a>
                        </div>
                    </div>
                </Window>
            </div>
        </div>
    )
}
