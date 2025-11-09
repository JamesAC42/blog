import Link from "next/link";
import { Button } from "../Button/Button";
import styles from "./portfoliopanel.module.scss";

export interface IPortfolioLink {
    label: string;
    url: string;
}

export interface IPortfolioItem {
    id: string;
    title: string;
    summary: string;
    year?: string;
    role?: string;
    tags?: string[];
    links?: IPortfolioLink[];
}

export interface IPortfolioPanelProps {
    intro?: string;
    projects: IPortfolioItem[];
}

export const PortfolioPanel = ({ intro, projects }: IPortfolioPanelProps) => {
    const featured = projects.slice(0, 3);

    return (
        <div className={styles.portfolioPanel}>
            {intro && <p className={styles.intro}>{intro}</p>}
            <div className={styles.projectsGrid}>
                {featured.map((project) => (
                    <article key={project.id} className={styles.projectCard}>
                        <div className={styles.projectMeta}>
                            {project.year && <span className={styles.projectYear}>{project.year}</span>}
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
                                {project.links.map((link) => (
                                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                                        {link.label}
                                    </a>
                                ))}
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
