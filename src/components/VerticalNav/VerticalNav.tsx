"use client";

import { Button } from "../Button/Button";
import styles from "./verticalnav.module.scss";
import {usePathname} from "next/navigation";
import { Window } from "../Window/Window";
import Link from "next/link";

import home from "@/assets/images/icons/home.png";
import blog from "@/assets/images/icons/blog.png";
import book from "@/assets/images/icons/book.png";
import gallery from "@/assets/images/icons/gallery.png";
import about from "@/assets/images/icons/about.png";
import projects from "@/assets/images/icons/projects.png";

export const VerticalNav = () => {
    const pathname = usePathname();

    return (
        <Window header="quick links">
            <div className={`windowContent`}>
                <div className={`${styles.verticalNav}`}>
                    <Link href="/" className={styles.navLink}>
                        <Button active={pathname === "/"} icon={home} text="Home"/>
                    </Link>
                    <Link href="/aboutme" className={styles.navLink}>
                        <Button active={pathname === "/aboutme"} icon={about} text="About"/>
                    </Link>
                    <Link href="/blog" className={styles.navLink}>
                        <Button active={pathname.startsWith("/blog")} icon={blog} text="Blog"/>
                    </Link>
                    <Link href="/journal" className={styles.navLink}>
                        <Button active={pathname.startsWith("/journal")} icon={book} text="Journal"/>
                    </Link>
                    <Link href="/gallery" className={styles.navLink}>
                        <Button active={pathname === "/gallery"} icon={gallery} text="Gallery"/>
                    </Link>
                    <Link href="/projects" className={styles.navLink}>
                        <Button active={pathname === "/projects"} icon={projects} text="Projects"/>
                    </Link>
                </div>
            </div>
        </Window>
    )
}
