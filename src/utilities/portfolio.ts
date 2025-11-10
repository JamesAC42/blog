import type { PortfolioProject } from "@/types/portfolio";

const DISPLAY_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

export function formatProjectDate(project: PortfolioProject): string {
  if (project.displayDate && project.displayDate.trim().length > 0) {
    return project.displayDate.trim();
  }
  if (project.workedOn) {
    const dt = new Date(project.workedOn);
    if (!Number.isNaN(dt.getTime())) {
      return DISPLAY_FORMATTER.format(dt);
    }
  }
  if (project.year && project.year.trim().length > 0) {
    return project.year.trim();
  }
  return "—";
}

export function sortProjects<T extends PortfolioProject>(projects: T[]): T[] {
  return [...projects].sort((a, b) => {
    const aTime = a.workedOn ? new Date(a.workedOn).getTime() : 0;
    const bTime = b.workedOn ? new Date(b.workedOn).getTime() : 0;
    if (aTime && bTime && aTime !== bTime) {
      return bTime - aTime;
    }
    const aYear = parseInt(a.year ?? "0", 10) || 0;
    const bYear = parseInt(b.year ?? "0", 10) || 0;
    if (aYear !== bYear) {
      return bYear - aYear;
    }
    return b.title.localeCompare(a.title);
  });
}
