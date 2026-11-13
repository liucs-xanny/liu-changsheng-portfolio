"use client";

import { projects } from "@/lib/projects";
import { getProjectCategories, projectCategories, type ProjectCategory } from "@/lib/project-categories";
import { assetPath } from "@/lib/assets";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export function ProjectArchive() {
  const section = useRef<HTMLElement>(null);
  const [category, setCategory] = useState<ProjectCategory | "全部">("AIGC影视");
  const filtered = useMemo(() => {
    // AIGC leads in the complete archive; preserve the editor's order within
    // each group. Filtering never changes the underlying project content.
    const ordered = [...projects].sort((a, b) => Number(getProjectCategories(b).includes("AIGC影视")) - Number(getProjectCategories(a).includes("AIGC影视")));
    return category === "全部" ? ordered : ordered.filter(project => getProjectCategories(project).includes(category));
  }, [category]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".archive-card");
      cards.forEach((card, index) => {
        gsap.fromTo(card, { y: 60, scale: .96, opacity: .55 }, {
          y: 0, scale: 1, opacity: 1,
          scrollTrigger: { trigger: card, start: "top 92%", end: "top 48%", scrub: .7 },
        });
        card.style.zIndex = String(index + 1);
      });
    }, section);
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => { cancelAnimationFrame(frame); context.revert(); };
  }, [filtered]);

  function selectCategory(name: ProjectCategory | "全部") {
    if (name === category) return;
    setCategory(name);
    requestAnimationFrame(() => section.current?.scrollIntoView({block:"start", behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}));
  }

  return (
    <section ref={section} id="work" className="relative z-10 bg-[#15130f] px-5 py-20 md:px-10 md:py-28 lg:px-16" style={{scrollMarginTop:56}} aria-labelledby="archive-heading">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-8">
        <div><p className="eyebrow">03 / SELECTED WORKS</p><h2 id="archive-heading" className="section-title">PROJECT<br />ARCHIVE</h2></div>
        <p className="max-w-xs text-sm leading-7 text-paper/50">AI 影像、智能产品与多领域设计实践。<br />选择一个方向，快速了解我做过什么。</p>
      </div>
      <div className="archive-category-bar sticky top-[54px] z-30 mb-8 flex flex-wrap items-center justify-between gap-3 border-y border-paper/15 bg-[#15130f]/95 py-4 backdrop-blur-xl">
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
          <article key={project.slug} className="archive-card sticky top-[170px] mb-[18vh] h-[72svh] overflow-hidden rounded-[2rem] border border-paper/15 bg-[#1b1916]/95 shadow-[0_-24px_80px_rgba(0,0,0,.45)] backdrop-blur-xl md:top-[130px] md:h-[68vh]">
            <Image src={assetPath(project.cover)} alt={project.title} fill sizes="(max-width: 768px) 95vw, 1280px" className={`object-cover opacity-35 transition duration-700 hover:scale-105 hover:opacity-65 ${project.slug === "medical-robot" ? "object-top" : ""}`} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-between p-7 md:p-12">
              <div className="flex items-start justify-between gap-4"><span className="archive-number font-display text-6xl text-paper/15 md:text-8xl">{String(index + 1).padStart(2, "0")}</span><span className="text-xs tracking-[.12em] text-peach">{project.time}</span></div>
              <div className="max-w-3xl">
                <h3 className="mt-3 text-2xl font-semibold md:text-5xl">{project.title}</h3>
                {project.role && <p className="mt-4 line-clamp-2 text-xs leading-6 text-peach">{project.role}</p>}
                <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-7 text-paper/65">{project.summary || project.overview}</p>
                <div className="mt-5 flex flex-wrap gap-2">{project.tags.map(tag => <span key={tag} className="rounded-full border border-paper/20 px-3 py-1 text-[10px] tracking-wider">{tag}</span>)}</div>
                <Link href={`/projects/${project.slug}/`} className="mt-6 inline-flex items-center gap-4 rounded-full bg-peach px-6 py-3 text-xs font-bold tracking-[.16em] text-ink transition hover:shadow-[0_0_30px_rgba(255,184,148,.45)]">VIEW CASE <span>↗</span></Link>
              </div>
            </div>
          </article>
        ))}
        {!filtered.length && <p className="py-20 text-center text-paper/50">这个分类暂时没有公开项目。</p>}
      </div>
    </section>
  );
}
