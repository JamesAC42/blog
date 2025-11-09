import { prisma } from "@/lib/prisma";
import { PageWrapper } from "@/components/PageWrapper/PageWrapper";
import { Window } from "@/components/Window/Window";
import styles from "./projects.module.scss";
import type { IPortfolioItem } from "@/components/PortfolioPanel/PortfolioPanel";
import HeaderBox from "@/components/HeaderBox/HeaderBox";

type PortfolioSettings = {
  intro?: string;
  projects?: IPortfolioItem[];
};

async function getPortfolioContent() {
  const record = await prisma.settingsKV.findUnique({ where: { key: "portfolio" } });
  const value = (record?.value as PortfolioSettings) ?? {};
  return {
    intro: typeof value.intro === "string" ? value.intro : "",
    projects: Array.isArray(value.projects) ? (value.projects as IPortfolioItem[]) : [],
  };
}

export default async function PortfolioPage() {
  const { intro, projects } = await getPortfolioContent();

  return (
    <PageWrapper>
      <HeaderBox header="Projects" subtitle2="" showFlashy={false} />
      <br/>
      <div className={styles.portfolioPage}>

        <section className={styles.projectsSection}>
          {projects.map((project) => (
            <Window key={project.id} header={project.title} showButtons={true}>
              <div className={`windowContent ${styles.projectContent}`}>
                <div className={styles.projectMeta}>
                  <span>{project.year ?? "—"}</span>
                  <span>{project.role ?? ""}</span>
                </div>
                <p className={styles.projectSummary}>{project.summary}</p>
                {project.tags?.length ? (
                  <ul className={styles.tagList}>
                    {project.tags.map((tag) => (
                      <li key={`${project.id}-${tag}`}>{tag}</li>
                    ))}
                  </ul>
                ) : null}
                {project.links?.length ? (
                  <div className={styles.linkRow}>
                    {project.links.map((link) => (
                      <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </Window>
          ))}
        </section>
      </div>
    </PageWrapper>
  );
}
