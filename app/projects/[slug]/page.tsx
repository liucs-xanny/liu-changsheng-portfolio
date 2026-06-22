import { Nav } from "@/components/Nav";
import { ProjectCase } from "@/components/ProjectCase";
import { getProject, projects } from "@/lib/projects";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const index = projects.findIndex((item) => item.slug === slug);
  const next = projects[(index + 1) % projects.length];
  return <><Nav project /><ProjectCase project={project} next={next} /></>;
}
