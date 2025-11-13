import { prisma } from "@/lib/prisma";
import { PageWrapper } from "@/components/PageWrapper/PageWrapper";
import { Window } from "@/components/Window/Window";
import styles from "./projects.module.scss";
import HeaderBox from "@/components/HeaderBox/HeaderBox";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { PortfolioProject, PortfolioSettings } from "@/types/portfolio";
import { formatProjectDate, sortProjects } from "@/utilities/portfolio";
import { getLinkDisplayLabel, getPresetForType } from "@/components/PortfolioLink/PortfolioLinkIcons";
import { ProjectGallery } from "@/components/PortfolioProject/ProjectGallery";

export const revalidate = 0;

function sanitizeProject(project: PortfolioProject): PortfolioProject {
  const images = Array.isArray(project.images)
    ? project.images
        .filter((img) => !!img && typeof img.url === "string" && img.url.length > 0)
        .map((img, idx) => ({ ...img, id: img.id ?? `${project.id}-image-${idx}` }))
    : [];
  const links = Array.isArray(project.links)
    ? project.links
        .filter((link) => !!link && typeof link.url === "string" && link.url.length > 0)
        .map((link, idx) => ({ ...link, id: link.id ?? `${project.id}-link-${idx}` }))
    : [];
  const tags = Array.isArray(project.tags)
    ? project.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    : [];

  return {
    ...project,
    summary: project.summary ?? "",
    images,
    links,
    tags,
  };
}

async function getPortfolioContent() {
  const record = await prisma.settingsKV.findUnique({ where: { key: "portfolio" } });
  const value = (record?.value as PortfolioSettings) ?? {};
  const intro = typeof value.intro === "string" ? value.intro : "";
  const projects = Array.isArray(value.projects) ? value.projects.map((project) => sanitizeProject(project as PortfolioProject)) : [];
  return { intro, projects } satisfies PortfolioSettings;
}

export default async function PortfolioPage() {
  const { intro, projects } = await getPortfolioContent();

  return (
    <PageWrapper>
      <HeaderBox header="Projects" subtitle2="" showFlashy={false} />
      <br/>
      <div className={styles.portfolioPage}>
        {intro ? (
          <section className={styles.introSection}>
            <div className={styles.introContent}>
              <p>{intro}</p>
            </div>
          </section>
        ) : null}
        <section className={styles.projectsSection}>
          {sortProjects(projects).map((project) => {
            const images = project.images ?? [];
            const [heroImage, ...galleryImages] = images;
            return (
              <Window key={project.id}>
                <div className={`windowContent ${styles.projectContent}`}>
                  <div className={styles.projectHeader}>
                    <p className={styles.projectMeta}>
                      <span>{formatProjectDate(project)}</span>
                      {project.role ? <span>• {project.role}</span> : null}
                    </p>
                    <h3>{project.title}</h3>
                    {project.links?.length ? (
                      <div className={styles.projectLinks}>
                        {project.links.map((link) => {
                          const preset = getPresetForType(link.type);
                          const Icon = preset?.Icon;
                          const label = getLinkDisplayLabel(link);
                          return (
                            <a
                              key={link.id ?? link.url}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={label}
                              title={label}
                            >
                              {Icon ? <Icon size={20} aria-hidden className={styles.linkIcon} /> : <span className={styles.linkFallback}>↗</span>}
                              <span className={styles.srOnly}>{label}</span>
                            </a>
                          );
                        })}
                      </div>
                    ) : null}
                    <p className={styles.projectSummary}>{project.summary}</p>
                  </div>
                  {project.body ? (
                    <div className={styles.projectBody}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {project.body}
                      </ReactMarkdown>
                    </div>
                  ) : null}
                  <ProjectGallery heroImage={heroImage} galleryImages={galleryImages} projectTitle={project.title} />
                  {project.tags?.length ? (
                    <ul className={styles.tagList}>
                      {project.tags.map((tag) => (
                        <li key={`${project.id}-${tag}`}>{tag}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </Window>
            );
          })}
        </section>
      </div>
    </PageWrapper>
  );
}
