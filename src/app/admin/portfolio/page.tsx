"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../admin.module.scss";
import localStyles from "./portfolio.module.scss";
import { v4 as uuid } from "uuid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Image from "next/image";
import type { PortfolioImage, PortfolioLink, PortfolioLinkType, PortfolioProject, PortfolioSettings } from "@/types/portfolio";
import { formatProjectDate, sortProjects } from "@/utilities/portfolio";
import { PORTFOLIO_LINK_PRESETS, getPresetForType } from "@/components/PortfolioLink/PortfolioLinkIcons";

type EditableImage = PortfolioImage & { id: string };
type EditableLink = PortfolioLink & { id: string };
type EditableProject = Omit<PortfolioProject, "images" | "links" | "tags"> & {
  clientKey: string;
  tags: string[];
  tagInput: string;
  images: EditableImage[];
  links: EditableLink[];
};

const LINK_TYPE_OPTIONS = [...PORTFOLIO_LINK_PRESETS.map((preset) => ({ label: preset.label, value: preset.type })), { label: "Custom", value: "custom" }];

const createEmptyProject = (): EditableProject => ({
  clientKey: uuid(),
  id: uuid(),
  title: "",
  summary: "",
  role: "",
  tags: [],
  tagInput: "",
  workedOn: undefined,
  body: "",
  images: [],
  links: [],
});

const ensureImage = (image?: PortfolioImage | null): EditableImage => ({
  id: image?.id ?? uuid(),
  url: image?.url ?? "",
  caption: image?.caption ?? "",
});

const ensureLink = (link?: PortfolioLink | null): EditableLink => ({
  id: link?.id ?? uuid(),
  type: link?.type ?? "custom",
  label: link?.label ?? "",
  url: link?.url ?? "",
});

const normalizeProject = (project: PortfolioProject): EditableProject => ({
  ...createEmptyProject(),
  ...project,
  clientKey: uuid(),
  title: project.title ?? "",
  summary: project.summary ?? "",
  role: project.role ?? "",
  body: project.body ?? "",
  tags: Array.isArray(project.tags) ? project.tags.map((tag) => String(tag)) : [],
  tagInput: Array.isArray(project.tags) ? project.tags.join(", ") : "",
  images: Array.isArray(project.images) ? project.images.map((image) => ensureImage(image)) : [],
  links: Array.isArray(project.links) ? project.links.map((link) => ensureLink(link)) : [],
  workedOn: typeof project.workedOn === "string" ? project.workedOn : undefined,
});

const parseTags = (input: string): string[] => input.split(",").map((tag) => tag.trim()).filter(Boolean);

const monthValueFromIso = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
};

const isoFromMonthValue = (value: string) => {
  if (!value) return undefined;
  const iso = `${value}-01T00:00:00.000Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const trimOrUndefined = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const prepareProjectForSave = (project: EditableProject): PortfolioProject => {
  const { clientKey, images, links, tags, ...rest } = project;
  void clientKey;
  const workedOn = project.workedOn ? new Date(project.workedOn).toISOString() : undefined;
  const safeImages = images
    .filter((img) => img.url.trim().length > 0)
    .map((img) => ({ id: img.id ?? uuid(), url: img.url.trim(), caption: trimOrUndefined(img.caption) }));
  const safeLinks = links
    .filter((link) => link.url.trim().length > 0)
    .map((link) => ({
      id: link.id ?? uuid(),
      type: (link.type as PortfolioLinkType) ?? "custom",
      label: trimOrUndefined(link.label),
      url: link.url.trim(),
    }));
  const safeTags = tags.map((tag) => tag.trim()).filter(Boolean);
  const computedYear = workedOn ? new Date(workedOn).getUTCFullYear().toString() : trimOrUndefined(project.year ?? "");

  return {
    ...rest,
    tags: safeTags,
    images: safeImages,
    links: safeLinks,
    workedOn,
    year: computedYear,
    displayDate: trimOrUndefined(project.displayDate ?? undefined),
    title: project.title ?? "",
    summary: project.summary ?? "",
    role: project.role ?? "",
    body: project.body ?? "",
  } satisfies PortfolioProject;
};

export default function PortfolioAdminPage() {
  const [intro, setIntro] = useState("");
  const [projects, setProjects] = useState<EditableProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await fetch("/api/admin/settings/portfolio");
        if (!resp.ok) throw new Error("Failed to load portfolio");
        const data = (await resp.json()) as PortfolioSettings;
        setIntro(typeof data.intro === "string" ? data.intro : "");
        const normalized = Array.isArray(data.projects)
          ? data.projects.map((project) => normalizeProject(project as PortfolioProject))
          : [];
        setProjects(normalized);
      } catch (error) {
        console.error(error);
        setMsg("Failed to load portfolio settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateProject = (id: string, updater: (project: EditableProject) => EditableProject) => {
    setProjects((prev) => prev.map((project) => (project.clientKey === id ? updater(project) : project)));
  };

  const addProject = () => {
    setProjects((prev) => [...prev, createEmptyProject()]);
  };

const duplicateProject = (id: string) => {
  setProjects((prev) => {
    const project = prev.find((p) => p.clientKey === id);
    if (!project) return prev;
    const clone: EditableProject = {
      ...project,
      clientKey: uuid(),
      id: `${project.id}-copy`,
      title: `${project.title} (copy)`,
      images: project.images.map((image) => ({ ...image, id: uuid() })),
      links: project.links.map((link) => ({ ...link, id: uuid() })),
      tags: [...project.tags],
      tagInput: project.tagInput,
    };
    return [...prev, clone];
  });
};

  const removeProject = (id: string) => {
    setProjects((prev) => prev.filter((project) => project.clientKey !== id));
  };

  const moveProject = (id: string, direction: -1 | 1) => {
    setProjects((prev) => {
      const index = prev.findIndex((project) => project.clientKey === id);
      if (index === -1) return prev;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

const sortByNewest = () => {
  setProjects((prev) => sortProjects(prev));
};

  const addImage = (projectKey: string) => {
    updateProject(projectKey, (project) => ({
      ...project,
      images: [...project.images, ensureImage(null)],
    }));
  };

  const updateImage = (projectKey: string, imageId: string, patch: Partial<PortfolioImage>) => {
    updateProject(projectKey, (project) => ({
      ...project,
      images: project.images.map((image) => (image.id === imageId ? { ...image, ...patch } : image)),
    }));
  };

  const removeImage = (projectKey: string, imageId: string) => {
    updateProject(projectKey, (project) => ({
      ...project,
      images: project.images.filter((image) => image.id !== imageId),
    }));
  };

  const addLink = (projectKey: string) => {
    updateProject(projectKey, (project) => ({
      ...project,
      links: [...project.links, ensureLink(null)],
    }));
  };

  const updateLink = (projectKey: string, linkId: string, patch: Partial<PortfolioLink>) => {
    updateProject(projectKey, (project) => ({
      ...project,
      links: project.links.map((link) => (link.id === linkId ? { ...link, ...patch } : link)),
    }));
  };

  const removeLink = (projectKey: string, linkId: string) => {
    updateProject(projectKey, (project) => ({
      ...project,
      links: project.links.filter((link) => link.id !== linkId),
    }));
  };

  const handleImageUpload = async (projectKey: string, imageId: string, file: File) => {
    setUploading((prev) => ({ ...prev, [imageId]: true }));
    try {
      const resp = await fetch(`/api/admin/portfolio/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!resp.ok) throw new Error("Upload failed");
      const data = (await resp.json()) as { url: string };
      updateImage(projectKey, imageId, { url: data.url });
    } catch (error) {
      console.error(error);
      setMsg("Image upload failed");
    } finally {
      setUploading((prev) => {
        const next = { ...prev };
        delete next[imageId];
        return next;
      });
    }
  };

  const projectsPayload = useMemo(() => projects.map((project) => prepareProjectForSave(project)), [projects]);

  const savePortfolio = async () => {
    setSaving(true);
    setMsg("");
    try {
      const resp = await fetch("/api/admin/settings/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intro, projects: projectsPayload }),
      });
      if (!resp.ok) throw new Error("Failed to save");
      setMsg("Saved portfolio");
    } catch (error) {
      console.error(error);
      setMsg("Failed to save portfolio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.adminRoot}>
      <div className={styles.adminContainer}>
        <div className={styles.toolbar}>
          <h1 className={styles.adminTitle}>Portfolio projects</h1>
          <a className={`${styles.buttonSecondary} ${styles.backLink}`} href="/admin">← Back</a>
        </div>
        {msg && <div className={styles.msg}>{msg}</div>}

        <section className={styles.adminSection}>
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionHeader}>Intro copy</h2>
            <textarea value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Short intro shown above featured projects" />
          </div>
        </section>

        <section className={styles.adminSection}>
          <div className={styles.actionsRow}>
            <button type="button" className={styles.buttonPrimary} disabled={saving} onClick={savePortfolio}>
              {saving ? "Saving…" : "Save portfolio"}
            </button>
            <button type="button" className={styles.buttonSecondary} onClick={sortByNewest}>
              Sort by newest
            </button>
            <span>Projects: {projects.length}</span>
          </div>
        </section>

        {loading ? (
          <div className={`${styles.sectionCard} ${localStyles.emptyState}`}>Loading portfolio…</div>
        ) : (
          <div className={localStyles.projectList}>
            {projects.length === 0 ? (
              <div className={`${styles.sectionCard} ${localStyles.emptyState}`}>
                No projects yet. Add one below.
              </div>
            ) : (
              projects.map((project, index) => {
                const monthValue = monthValueFromIso(project.workedOn);
                return (
                  <div key={project.clientKey} className={`${styles.sectionCard} ${localStyles.projectCard}`}>
                    <div className={localStyles.projectHeader}>
                      <div>
                        <h3 className={styles.sectionHeader}>{project.title || `Project ${index + 1}`}</h3>
                        <div className={localStyles.projectMeta}>
                          <span className={localStyles.metaBadge}>{formatProjectDate(project)}</span>
                          {project.role ? <span>{project.role}</span> : <span className={localStyles.smallNote}>Role not set</span>}
                        </div>
                      </div>
                      <div className={localStyles.projectActions}>
                        <button type="button" className={styles.buttonSecondary} disabled={index === 0} onClick={() => moveProject(project.clientKey, -1)}>
                          ↑
                        </button>
                        <button type="button" className={styles.buttonSecondary} disabled={index === projects.length - 1} onClick={() => moveProject(project.clientKey, 1)}>
                          ↓
                        </button>
                        <button type="button" className={styles.buttonSecondary} onClick={() => duplicateProject(project.clientKey)}>
                          Duplicate
                        </button>
                        <button type="button" className={styles.buttonSecondary} onClick={() => removeProject(project.clientKey)}>
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className={localStyles.dualColumn}>
                      <label>
                        Slug / ID
                        <input value={project.id} onChange={(e) => updateProject(project.clientKey, (p) => ({ ...p, id: e.target.value }))} />
                        <span className={localStyles.smallNote}>Used for anchors and keys; keep it unique.</span>
                      </label>
                      <label>
                        Role / responsibility
                        <input value={project.role ?? ""} onChange={(e) => updateProject(project.clientKey, (p) => ({ ...p, role: e.target.value }))} />
                      </label>
                    </div>

                    <label>
                      Project title
                      <input className={localStyles.input} value={project.title} onChange={(e) => updateProject(project.clientKey, (p) => ({ ...p, title: e.target.value }))} />
                    </label>

                    <label>
                      Short description
                      <textarea className={`${localStyles.compactTextarea} ${localStyles.input}`} value={project.summary} onChange={(e) => updateProject(project.clientKey, (p) => ({ ...p, summary: e.target.value }))} />
                    </label>

                    <div className={localStyles.dualColumn}>
                      <label>
                        Worked on (month)
                        <input
                          type="month"
                          value={monthValue}
                          onChange={(e) => updateProject(project.clientKey, (p) => ({ ...p, workedOn: isoFromMonthValue(e.target.value) }))}
                        />
                        <span className={localStyles.smallNote}>Used for sorting; displays as month + year.</span>
                      </label>
                      <label>
                        Tags (comma separated)
                        <input
                          value={project.tagInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateProject(project.clientKey, (p) => ({ ...p, tagInput: value, tags: parseTags(value) }));
                          }}
                          placeholder="TypeScript, WebGL, Design"
                        />
                      </label>
                    </div>

                    <div className={localStyles.markdownEditor}>
                      <label>
                        Extended description (Markdown supported)
                        <textarea value={project.body ?? ""} onChange={(e) => updateProject(project.clientKey, (p) => ({ ...p, body: e.target.value }))} />
                      </label>
                      <div>
                        <span className={localStyles.smallNote}>Live preview</span>
                        <div className={localStyles.markdownPreview}>
                          {project.body ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                              {project.body}
                            </ReactMarkdown>
                          ) : (
                            <p className={localStyles.smallNote}>Nothing to preview yet.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={localStyles.fieldStack}>
                      <div className={styles.toolbar}>
                        <h4 className={styles.sectionHeader}>Images</h4>
                        <button type="button" className={styles.buttonSecondary} onClick={() => addImage(project.clientKey)}>
                          + Add image
                        </button>
                      </div>
                      <div className={localStyles.imageList}>
                        {project.images.map((image) => (
                          <div key={image.id} className={localStyles.imageRow}>
                            <div className={localStyles.fieldStack}>
                              <label>
                                Image URL
                                <input value={image.url} onChange={(e) => updateImage(project.clientKey, image.id, { url: e.target.value })} placeholder="https://…" />
                              </label>
                              <label>
                                Caption
                                <input value={image.caption ?? ""} onChange={(e) => updateImage(project.clientKey, image.id, { caption: e.target.value })} />
                              </label>
                              <div className={styles.actionsRow}>
                                <label className={`${styles.buttonSecondary} ${localStyles.uploadLabel}`}>
                                  Upload image
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className={localStyles.hiddenInput}
                                    onChange={(event) => {
                                      const file = event.target.files?.[0];
                                      if (file) {
                                        handleImageUpload(project.clientKey, image.id, file);
                                        event.target.value = "";
                                      }
                                    }}
                                  />
                                </label>
                                {uploading[image.id] ? <span className={localStyles.smallNote}>Uploading…</span> : null}
                                <button type="button" className={styles.buttonSecondary} onClick={() => removeImage(project.clientKey, image.id)}>
                                  Remove
                                </button>
                              </div>
                            </div>
                            {image.url ? (
                              <Image
                                src={image.url}
                                alt={image.caption ?? "preview"}
                                className={localStyles.imagePreview}
                                width={640}
                                height={360}
                                sizes="(min-width: 1024px) 400px, 100vw"
                              />
                            ) : (
                              <div className={localStyles.imagePlaceholder}>No preview</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={localStyles.fieldStack}>
                      <div className={styles.toolbar}>
                        <h4 className={styles.sectionHeader}>Links</h4>
                        <button type="button" className={styles.buttonSecondary} onClick={() => addLink(project.clientKey)}>
                          + Add link
                        </button>
                      </div>
                      <div className={localStyles.linkList}>
                        {project.links.map((link) => {
                          const preset = getPresetForType(link.type);
                          const Icon = preset?.Icon;
                          return (
                            <div key={link.id} className={localStyles.linkRow}>
                              <label>
                                Type
                                <select
                                  value={link.type ?? "custom"}
                                  onChange={(e) => {
                                    const nextType = e.target.value as PortfolioLinkType;
                                    const nextPreset = getPresetForType(nextType);
                                    const shouldAutofill = !link.label || (preset && link.label === preset.label);
                                    updateLink(project.clientKey, link.id, {
                                      type: nextType,
                                      label: nextType !== "custom" && shouldAutofill ? nextPreset?.label ?? link.label : link.label,
                                    });
                                  }}
                                >
                                  {LINK_TYPE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Label
                                <input value={link.label ?? ""} onChange={(e) => updateLink(project.clientKey, link.id, { label: e.target.value })} placeholder={preset?.label ?? "View"} />
                              </label>
                              <label>
                                URL
                                <input value={link.url} onChange={(e) => updateLink(project.clientKey, link.id, { url: e.target.value })} placeholder="https://…" />
                              </label>
                              <div className={localStyles.linkExtras}>
                                <span className={localStyles.linkIconPreview}>{Icon ? <Icon size={18} aria-hidden /> : "⟡"}</span>
                                <button type="button" className={styles.buttonSecondary} onClick={() => removeLink(project.clientKey, link.id)}>
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <button type="button" className={styles.buttonSecondary} onClick={addProject}>
          + Add project
        </button>
      </div>
    </div>
  );
}
