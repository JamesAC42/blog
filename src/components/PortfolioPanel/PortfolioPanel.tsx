import Link from "next/link";
import { Button } from "../Button/Button";
import styles from "./portfoliopanel.module.scss";
import type { PortfolioProject } from "@/types/portfolio";
import { formatProjectDate, sortProjects } from "@/utilities/portfolio";
import { getLinkDisplayLabel, getPresetForType } from "@/components/PortfolioLink/PortfolioLinkIcons";

export interface IPortfolioPanelProps {
    intro?: string;
    projects: PortfolioProject[];
}

export const PortfolioPanel = ({ intro, projects }: IPortfolioPanelProps) => {
    const featured = sortProjects(projects).slice(0, 3);

    return (
        <div className={styles.portfolioPanel}>
            {intro && <p className={styles.intro}>{intro}</p>}
            <div className={styles.projectsGrid}>
                {featured.map((project) => (
                    <article key={project.id} className={styles.projectCard}>
                        <div className={styles.projectMeta}>
                            <span className={styles.projectYear}>{formatProjectDate(project)}</span>
                            {project.role && <span className={styles.projectRole}>{project.role}</span>}
                        </div>
                        <h3 className={styles.projectTitle}>{project.title}</h3>
                        <p className={styles.projectSummary}>{project.summary}</p>
                        {project.tags?.length ? (
                            <ul className={styles.tagList}>
                                {project.tags.map((tag) => (
                                    <li key={tag}>{tag}</li>
                                ))}
                            </ul>
                        ) : null}
                        {project.links?.length ? (
                            <div className={styles.links}>
                                {project.links.map((link) => {
                                    const preset = getPresetForType(link.type);
                                    const Icon = preset?.Icon;
                                    const label = getLinkDisplayLabel(link);
                                    return (
                                        <a key={link.id ?? link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                                            {Icon ? <Icon className={styles.linkIcon} aria-hidden size={16} /> : null}
                                            <span>{label}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        ) : null}
                    </article>
                ))}
            </div>
            <div className={styles.actions}>
                <Link href="/projects">
                    <Button text="View All" />
                </Link>
            </div>
        </div>
    );
};

export default PortfolioPanel;
