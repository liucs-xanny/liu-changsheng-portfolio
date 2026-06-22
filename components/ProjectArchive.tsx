"use client";

import { projects } from "@/lib/projects";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

export function ProjectArchive() {
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".archive-card");
      cards.forEach((card, index) => {
        gsap.fromTo(card, { y: 90 + index * 24, scale: 0.94 - index * 0.015, opacity: 0.35 }, {
          y: index * 22,
          scale: 1 - index * 0.018,
          opacity: 1,
          scrollTrigger: { trigger: card, start: "top 86%", end: "top 42%", scrub: 0.7 },
        });
      });
    }, section);
    return () => context.revert();
  }, []);

  return (
    <section ref={section} id="work" className="relative z-10 bg-[#15130f] px-5 py-28 md:px-10 lg:px-16">
      <div className="sticky top-0 z-0 flex h-[42vh] items-center justify-between bg-[#15130f]">
        <div><p className="eyebrow">03 / SELECTED WORKS</p><h2 className="section-title">PROJECT<br />ARCHIVE</h2></div>
        <p className="hidden max-w-xs text-right text-sm leading-7 text-paper/50 md:block">A digital archive of AI, interaction,<br />service and product experience projects.</p>
      </div>
      <div className="relative z-10 mx-auto max-w-7xl pb-24">
        {projects.map((project) => (
          <article key={project.slug} className="archive-card sticky top-[12vh] mb-[28vh] h-[68vh] overflow-hidden rounded-[2rem] border border-paper/15 bg-[#1b1916]/95 shadow-[0_-24px_80px_rgba(0,0,0,.45)] backdrop-blur-xl">
            <Image src={project.cover} alt={project.title} fill className={`object-cover opacity-35 transition duration-700 hover:scale-105 hover:opacity-65 ${project.slug === "medical-robot" ? "object-top" : ""}`} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-between p-7 md:p-12">
              <div className="flex items-start justify-between"><span className="font-display text-7xl text-paper/15 md:text-9xl">{project.index}</span><span className="text-xs tracking-[.18em] text-peach">{project.time}</span></div>
              <div className="max-w-3xl">
                <p className="text-xs tracking-[.18em] text-peach">{project.english}</p>
                <h3 className="mt-3 text-3xl font-semibold md:text-6xl">{project.title}</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-paper/65">{project.summary}</p>
                <div className="mt-6 flex flex-wrap gap-2">{project.tags.map((tag) => <span key={tag} className="rounded-full border border-paper/20 px-3 py-1 text-[10px] tracking-wider">{tag}</span>)}</div>
                <Link href={`/projects/${project.slug}/`} className="mt-8 inline-flex items-center gap-4 rounded-full bg-peach px-6 py-3 text-xs font-bold tracking-[.16em] text-ink transition hover:shadow-[0_0_30px_rgba(255,184,148,.45)]">VIEW CASE <span>↗</span></Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
