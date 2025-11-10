import { prisma } from "@/lib/prisma";
import { PageWrapper } from "@/components/PageWrapper/PageWrapper";
import { Window } from "@/components/Window/Window";
import styles from "./projects.module.scss";
import HeaderBox from "@/components/HeaderBox/HeaderBox";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Image from "next/image";
import type { PortfolioProject, PortfolioSettings } from "@/types/portfolio";
import { formatProjectDate, sortProjects } from "@/utilities/portfolio";
import { getLinkDisplayLabel, getPresetForType } from "@/components/PortfolioLink/PortfolioLinkIcons";

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
          {sortProjects(projects).map((project) => (
            <Window key={project.id} header={project.title} showButtons={true}>
              <div className={`windowContent ${styles.projectContent}`}>
                <div className={styles.projectMeta}>
                  <span>{formatProjectDate(project)}</span>
                  <span>{project.role ?? ""}</span>
                </div>
                <p className={styles.projectSummary}>{project.summary}</p>
                {project.body ? (
                  <div className={styles.projectBody}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                      {project.body}
                    </ReactMarkdown>
                  </div>
                ) : null}
                {project.images?.length ? (
                  <div className={styles.projectGallery}>
                    {project.images.map((image, idx) => (
                      <figure key={`${project.id}-${image.id ?? idx}`}>
                        <Image
                          src={image.url}
                          alt={image.caption ?? project.title}
                          width={1200}
                          height={800}
                          sizes="(min-width: 1024px) 600px, 100vw"
                        />
                        {image.caption ? <figcaption>{image.caption}</figcaption> : null}
                      </figure>
                    ))}
                  </div>
                ) : null}
                {project.tags?.length ? (
                  <ul className={styles.tagList}>
                    {project.tags.map((tag) => (
                      <li key={`${project.id}-${tag}`}>{tag}</li>
                    ))}
                  </ul>
                ) : null}
                {project.links?.length ? (
                  <div className={styles.linkRow}>
                    {project.links.map((link) => {
                      const preset = getPresetForType(link.type);
                      const Icon = preset?.Icon;
                      const label = getLinkDisplayLabel(link);
                      return (
                        <a key={link.id ?? link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                          {Icon ? <Icon size={16} className={styles.linkIcon} aria-hidden /> : null}
                          <span>{label}</span>
                        </a>
                      );
                    })}
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
