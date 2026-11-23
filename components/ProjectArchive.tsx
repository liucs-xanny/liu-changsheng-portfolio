"use client";

import { projects } from "@/lib/projects";
import { getProjectCategories, projectCategories, type ProjectCategory } from "@/lib/project-categories";
import { previewPath } from "@/lib/assets";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export function ProjectArchive() {
  const section = useRef<HTMLElement>(null);
  const [category, setCategory] = useState<ProjectCategory | "全部">("AIGC影视");
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("portfolio-project-category");
      if (saved === "全部" || projectCategories.includes(saved as ProjectCategory)) setCategory(saved as ProjectCategory | "全部");
    } catch { /* Browsing still works when storage is disabled. */ }
  }, []);
  const filtered = useMemo(() => {
    // AIGC leads in the complete archive; preserve the editor's order within
    // each group. Filtering never changes the underlying project content.
    const ordered = [...projects].sort((a, b) => Number(getProjectCategories(b).includes("AIGC影视")) - Number(getProjectCategories(a).includes("AIGC影视")));
    return category === "全部" ? ordered : ordered.filter(project => getProjectCategories(project).includes(category));
  }, [category]);

  function selectCategory(name: ProjectCategory | "全部") {
    if (name === category) return;
    setCategory(name);
    try { sessionStorage.setItem("portfolio-project-category", name); } catch { /* Optional preference. */ }
    requestAnimationFrame(() => section.current?.scrollIntoView({block:"start", behavior:"instant"}));
  }

  return (
    <section ref={section} id="work" className="relative z-10 bg-[#15130f] px-5 py-20 md:px-10 md:py-28 lg:px-16" style={{scrollMarginTop:56}} aria-labelledby="archive-heading">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-8">
        <div><p className="eyebrow">03 / SELECTED WORKS</p><h2 id="archive-heading" className="section-title">PROJECT<br />ARCHIVE</h2></div>
        <p className="max-w-xs text-sm leading-7 text-paper/50">AI 影像、智能产品与多领域设计实践。<br />选择一个方向，快速了解我做过什么。</p>
      </div>
      <div className="archive-category-bar sticky top-[54px] z-30 mb-8 flex flex-wrap items-center justify-between gap-3 border-y border-paper/15 bg-[#15130f] py-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="项目分类">
          {([...projectCategories, "全部"] as const).map(name => {
            const count = name === "全部" ? projects.length : projects.filter(p => getProjectCategories(p).includes(name)).length;
            return <button key={name} type="button" aria-pressed={category === name} aria-controls="project-cards" onClick={() => selectCategory(name)} className={`archive-filter ${category === name ? "is-selected" : ""}`}>{name}<span>{String(count).padStart(2,"0")}</span></button>;
          })}
        </div>
        <p className="text-[10px] tracking-[.12em] text-paper/40" aria-live="polite">{filtered.length} PROJECTS</p>
      </div>
      <div id="project-cards" className="relative mx-auto max-w-7xl pb-10">
        {filtered.map((project, index) => (
          <article key={project.slug} style={{zIndex: index + 1}} className="archive-card group sticky mb-[18vh] h-[72svh] overflow-hidden rounded-[2rem] border border-paper/15 bg-[#1b1916] shadow-[0_-10px_28px_rgba(0,0,0,.35)] md:h-[68vh]">
            {project.cover && <Image src={previewPath(project.cover)} alt={project.title} fill sizes="(max-width: 768px) 95vw, 1280px" className={`object-cover opacity-35 transition-opacity duration-200 group-hover:opacity-50 ${project.slug === "medical-robot" ? "object-top" : ""}`} />}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-between p-7 md:p-12">
              <div className="flex items-start justify-between gap-4"><span className="archive-number font-display text-6xl text-paper/15 md:text-8xl">{String(index + 1).padStart(2, "0")}</span><div className="flex flex-col items-end gap-4"><span className="text-sm tracking-[.06em] text-peach">{project.time}</span><Link prefetch={false} href={`/projects/${project.slug}/`} aria-label={`查看项目：${project.title}`} className="inline-flex rounded-full bg-peach px-5 py-3 text-sm font-semibold text-ink transition hover:bg-paper">查看项目</Link></div></div>
              <div className="max-w-3xl">
                <h3 className="mt-3 text-2xl font-semibold md:text-5xl"><Link prefetch={false} href={`/projects/${project.slug}/`} className="transition-colors hover:text-peach">{project.title}</Link></h3>
                {project.role && <p className="mt-4 line-clamp-2 text-xs leading-6 text-peach">{project.role}</p>}
                <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-7 text-paper/65">{project.summary || project.overview}</p>
                <div className="mt-5 flex flex-wrap gap-2">{project.tags.map(tag => <span key={tag} className="rounded-full border border-paper/20 px-3 py-1 text-[10px] tracking-wider">{tag}</span>)}</div>
              </div>
            </div>
          </article>
        ))}
        {!filtered.length && <p className="py-20 text-center text-paper/50">这个分类暂时没有公开项目。</p>}
      </div>
    </section>
  );
}
