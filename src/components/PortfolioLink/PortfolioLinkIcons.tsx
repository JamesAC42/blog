import type { SVGProps, JSX } from "react";
import type { PortfolioLink, PortfolioLinkType } from "@/types/portfolio";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };
type IconComponent = (props: IconProps) => JSX.Element;

const baseStroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const GlobeIcon: IconComponent = ({ size = 18, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...baseStroke} {...props}>
    <circle cx="12" cy="12" r="8.25" />
    <path d="M12 3.75c-2.25 2.4-3.375 5.1-3.375 8.25S9.75 17.85 12 20.25m0-16.5c2.25 2.4 3.375 5.1 3.375 8.25S14.25 17.85 12 20.25" />
    <path d="M4.5 12h15" />
  </svg>
);

const BracketsIcon: IconComponent = ({ size = 18, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...baseStroke} {...props}>
    <path d="M7.5 6l-4.5 6 4.5 6m9-12 4.5 6-4.5 6" />
    <path d="M14.25 4.5l-4.5 15" />
  </svg>
);

const DocumentIcon: IconComponent = ({ size = 18, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...baseStroke} {...props}>
    <path d="M8.25 3.75h5.25L18 8.25v12H8.25z" />
    <path d="M13.5 3.75v4.5H18" />
    <path d="M10.5 12h4.5M10.5 15h3" />
  </svg>
);

const VideoIcon: IconComponent = ({ size = 18, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...baseStroke} {...props}>
    <rect x="4.5" y="6.75" width="11.25" height="10.5" rx="2" />
    <path d="M15.75 10.5l4.5-2.25v7.5l-4.5-2.25" />
    <path d="M7.5 3.75v3" />
    <path d="M12 3.75v3" />
    <path d="M16.5 3.75v3" />
  </svg>
);

const BrushIcon: IconComponent = ({ size = 18, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...baseStroke} {...props}>
    <path d="M4.5 19.5c0-2.485 2.015-4.5 4.5-4.5h1.5c1.657 0 3-1.343 3-3v-1.5" />
    <path d="M14.25 4.5l5.25 5.25-4.5 4.5-5.25-5.25z" />
    <path d="M9.75 9l-1.5-1.5" />
  </svg>
);

const PenNibIcon: IconComponent = ({ size = 18, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...baseStroke} {...props}>
    <path d="M12 3l4.5 4.5-4.5 9-4.5-9z" />
    <circle cx="12" cy="10.5" r="1.25" />
    <path d="M7.5 7.5L3.75 21 12 18l8.25 3-3.75-13.5" />
  </svg>
);

const CubeIcon: IconComponent = ({ size = 18, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...baseStroke} {...props}>
    <path d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9z" />
    <path d="M19.5 7.5 12 12 4.5 7.5" />
    <path d="M12 21v-9" />
  </svg>
);

const SparkIcon: IconComponent = ({ size = 18, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...baseStroke} {...props}>
    <path d="M12 3.75l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" />
    <path d="M6 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
  </svg>
);

const BirdIcon: IconComponent = ({ size = 18, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...baseStroke} {...props}>
    <path d="M21 6.75c-.75.5-1.65.8-2.55.9a3.563 3.563 0 0 0-6.075 2.4v.75A8.25 8.25 0 0 1 4.5 5.25s-3 6 3 9c-1.8 1.2-2.85 1.5-2.85 1.5.75 2.25 3.3 2.25 3.3 2.25 0 1.5-3.45 2.25-3.45 2.25 4.5 3 9.75 0 9.75-4.5 0-.112.004-.224.012-.335a5.49 5.49 0 0 0 4.038-5.247v-.168c.75-.5 1.35-1.35 1.35-1.35Z" />
  </svg>
);

export type PortfolioLinkPreset = {
  type: Exclude<PortfolioLinkType, "custom">;
  label: string;
  Icon: IconComponent;
};

export const PORTFOLIO_LINK_PRESETS: PortfolioLinkPreset[] = [
  { type: "website", label: "Website", Icon: GlobeIcon },
  { type: "github", label: "GitHub", Icon: BracketsIcon },
  { type: "docs", label: "Docs", Icon: DocumentIcon },
  { type: "video", label: "Video", Icon: VideoIcon },
  { type: "dribbble", label: "Dribbble", Icon: BrushIcon },
  { type: "behance", label: "Behance", Icon: SparkIcon },
  { type: "figma", label: "Figma", Icon: PenNibIcon },
  { type: "npm", label: "npm", Icon: CubeIcon },
  { type: "twitter", label: "Twitter", Icon: BirdIcon },
];

export const PORTFOLIO_LINK_PRESET_MAP: Record<PortfolioLinkPreset["type"], PortfolioLinkPreset> = PORTFOLIO_LINK_PRESETS.reduce(
  (acc, preset) => {
    acc[preset.type] = preset;
    return acc;
  },
  {} as Record<PortfolioLinkPreset["type"], PortfolioLinkPreset>,
);

export function getPresetForType(type?: PortfolioLinkType | null): PortfolioLinkPreset | undefined {
  if (!type || type === "custom") {
    return undefined;
  }
  return PORTFOLIO_LINK_PRESET_MAP[type];
}

export function getLinkDisplayLabel(link: PortfolioLink): string {
  if (link.label && link.label.trim().length > 0) {
    return link.label;
  }
  const preset = getPresetForType(link.type);
  if (preset) {
    return preset.label;
  }
  if (link.type && link.type !== "custom") {
    return link.type.charAt(0).toUpperCase() + link.type.slice(1);
  }
  return "Link";
}
