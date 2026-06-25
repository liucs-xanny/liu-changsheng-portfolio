export type GalleryItem = {
  src: string;
  title?: string;
  description?: string;
  format?: "landscape" | "portrait" | "square";
};

export type MediaSection = {
  eyebrow: string;
  title: string;
  description: string;
  items: GalleryItem[];
};

export type Project = {
  slug: string;
  index: string;
  title: string;
  english: string;
  summary: string;
  role: string;
  time: string;
  tags: string[];
  cover: string;
  accent: string;
  overview: string;
  problem: string;
  research: string[];
  strategy: string[];
  workflow: string[];
  outputs: string[];
  result: string;
  reflection: string;
  gallery: (string | GalleryItem)[];
  mediaSections?: MediaSection[];
  video?: string;
  videos?: {
    src: string;
    title: string;
    description: string;
    poster?: string;
  }[];
  document?: {
    src: string;
    label: string;
  };
};

export type EditableProject = Project & {
  hidden?: boolean;
};

import projectsData from "@/data/projects.json";

export const allProjects = projectsData as EditableProject[];

export const projects: Project[] = allProjects
  .filter((project) => !project.hidden)
  .map((project, index) => ({ ...project, index: String(index + 1).padStart(2, "0") }));

export const getProject = (slug: string) => projects.find((project) => project.slug === slug);
