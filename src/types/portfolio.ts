export type PortfolioLinkType =
  | "website"
  | "github"
  | "docs"
  | "video"
  | "dribbble"
  | "behance"
  | "figma"
  | "npm"
  | "twitter"
  | "custom";

export interface PortfolioImage {
  id?: string;
  url: string;
  caption?: string;
}

export interface PortfolioLink {
  id?: string;
  type?: PortfolioLinkType;
  label?: string;
  url: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  summary: string;
  role?: string;
  tags?: string[];
  workedOn?: string; // ISO timestamp used for sorting
  displayDate?: string; // Optional override for rendered month/year
  year?: string; // Backward compatibility with legacy data
  body?: string; // Extended markdown description
  images?: PortfolioImage[];
  links?: PortfolioLink[];
}

export interface PortfolioSettings {
  intro?: string;
  projects?: PortfolioProject[];
}

