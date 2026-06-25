"use client";

import type { Project } from "@/lib/projects";
import { MediaGallery } from "@/components/MediaGallery";
import { assetPath } from "@/lib/assets";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function NuclearCompare({ project }: { project: Project }) {
  const [position, setPosition] = useState(50);
  const layers = [project.gallery[0], project.gallery[1], project.gallery[2]].map((item) =>
    typeof item === "string" ? item : item.src,
  );
  const [layer, setLayer] = useState(0);
  return (
    <div className="space-y-5">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] border border-paper/15">
        <Image src={assetPath(layers[0])} alt="RGB原图" fill className="object-cover" />
        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${position}%` }}><div className="relative h-full" style={{ width: `${10000 / position}%` }}><Image src={assetPath(layers[1])} alt="YOLO识别结果" fill className="object-cover" /></div></div>
        <div className="absolute inset-y-0 w-px bg-peach" style={{ left: `${position}%` }} />
        <input aria-label="Before after comparison" type="range" min="5" max="95" value={position} onChange={(e) => setPosition(Number(e.target.value))} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      </div>
      <div className="flex gap-2">{["RGB", "YOLO", "SYSTEM"].map((name, index) => <button key={name} onClick={() => setLayer(index)} className={`rounded-full px-4 py-2 text-xs ${layer === index ? "bg-peach text-ink" : "border border-paper/20"}`}>{name}</button>)}</div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl"><Image src={assetPath(layers[layer])} alt={["RGB图", "YOLO识别结果", "识别系统"][layer]} fill className="object-cover" /></div>
    </div>
  );
}

function LechangMap({ project }: { project: Project }) {
  const points = ["黄金柰李", "丹霞岩石", "石乐乐IP", "AI音乐", "AI视频"];
  const [active, setActive] = useState(0);
  return (
    <div className="grid gap-4 rounded-[2rem] bg-[#1d2f62] p-6 md:grid-cols-[1fr_.6fr]">
      <div className="relative aspect-square overflow-hidden rounded-2xl"><Image src={assetPath(project.cover)} alt="乐昌品牌地图" fill className="object-cover opacity-75" />{points.map((point, index) => <button key={point} onClick={() => setActive(index)} style={{ left: `${18 + index * 16}%`, top: `${25 + (index % 2) * 32}%` }} className={`absolute rounded-full border px-3 py-2 text-[10px] ${active === index ? "border-peach bg-peach text-ink" : "border-paper bg-ink/70"}`}>{index + 1}</button>)}</div>
      <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col justify-center rounded-2xl border border-paper/15 p-6"><p className="eyebrow">MAP POINT 0{active + 1}</p><h3 className="mt-4 text-3xl">{points[active]}</h3><p className="mt-4 text-sm leading-7 text-paper/60">{["从黄金柰李提取清甜、丰收与地方物产的品牌感知。", "以丹霞岩石建立稳定、时间与地貌记忆。", "原创IP“石乐乐”连接地域文化、产品与消费场景。", "使用Suno完成主题音乐与歌词设计。", "使用Vidu与生成式AI制作数字MV和传播素材。"][active]}</p></motion.div>
    </div>
  );
}

export function ProjectCase({ project, next }: { project: Project; next: Project }) {
  return (
    <main className="bg-ink text-paper">
      <section className="relative min-h-screen overflow-hidden">
        <Image src={assetPath(project.cover)} alt={project.title} fill priority className={`object-cover opacity-45 ${project.slug === "medical-robot" ? "object-top" : ""}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-black/30" />
        <div className="relative flex min-h-screen flex-col justify-end px-5 pb-14 pt-32 md:px-10 lg:px-16">
          <div className="mb-10 flex justify-between border-b border-paper/20 pb-5 text-xs tracking-[.16em] text-peach"><span>{project.index} / CASE STUDY</span><span>{project.time}</span></div>
          <p className="text-xs tracking-[.18em] text-peach">{project.english}</p>
          <h1 className="mt-4 max-w-6xl text-5xl font-semibold leading-tight md:text-8xl">{project.title}</h1>
          <p className="mt-7 max-w-3xl text-lg text-paper/65 md:text-2xl">{project.summary}</p>
          <div className="mt-10 flex flex-wrap gap-2">{project.tags.map((tag) => <span key={tag} className="rounded-full border border-paper/25 px-4 py-2 text-xs">{tag}</span>)}</div>
        </div>
      </section>
      <section className="px-5 py-24 md:px-10 lg:px-16">
        <div className="grid gap-12 border-b border-paper/15 pb-20 md:grid-cols-[.45fr_1fr]"><p className="eyebrow">01 / OVERVIEW</p><div><p className="text-2xl leading-relaxed md:text-5xl">{project.overview}</p><p className="mt-8 text-sm text-paper/50">{project.role}</p></div></div>
        <CaseSection number="02" title="PROBLEM"><p className="case-lead">{project.problem}</p></CaseSection>
        <CaseSection number="03" title="MY ROLE"><p className="case-lead">{project.role}</p></CaseSection>
        <CaseSection number="04" title="RESEARCH"><List items={project.research} /></CaseSection>
        <CaseSection number="05" title="STRATEGY"><List items={project.strategy} /></CaseSection>
        <CaseSection number="06" title="WORKFLOW"><div className="grid gap-3 md:grid-cols-3">{project.workflow.map((item, index) => <div key={item} className="panel"><span className="text-xs text-peach">0{index + 1}</span><p className="mt-10 text-xl">{item}</p></div>)}</div></CaseSection>
        <CaseSection number="07" title="DESIGN OUTPUT">
          {project.slug === "nuclear-ai" && <div className="mb-12"><NuclearCompare project={project} /></div>}
          {project.slug === "lechang" && <div className="mb-12"><LechangMap project={project} /></div>}
          <MediaGallery project={project} />
          <div className="mt-8 grid gap-3 md:grid-cols-3">{project.outputs.map((item) => <div key={item} className="rounded-2xl bg-blue/10 p-6 text-sm leading-7 text-paper/70">{item}</div>)}</div>
        </CaseSection>
        <CaseSection number="08" title="RESULT"><p className="case-lead text-peach">{project.result}</p></CaseSection>
        <CaseSection number="09" title="REFLECTION"><p className="case-lead">{project.reflection}</p></CaseSection>
      </section>
      <Link href={`/projects/${next.slug}/`} className="group block bg-blue px-5 py-24 md:px-10 lg:px-16"><p className="text-xs tracking-[.2em] text-paper/50">NEXT CASE / {next.index}</p><div className="mt-8 flex items-end justify-between"><h2 className="max-w-5xl text-5xl font-semibold transition group-hover:translate-x-4 md:text-8xl">{next.title}</h2><span className="text-5xl">↗</span></div></Link>
    </main>
  );
}

function CaseSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section className="grid gap-8 border-b border-paper/15 py-20 md:grid-cols-[.25fr_1fr]"><div><p className="eyebrow">{number} / {title}</p></div><div>{children}</div></section>;
}

function List({ items }: { items: string[] }) {
  return <div>{items.map((item, index) => <div key={item} className="grid grid-cols-[40px_1fr] border-t border-paper/15 py-6"><span className="text-xs text-peach">0{index + 1}</span><p className="text-lg leading-relaxed text-paper/75">{item}</p></div>)}</div>;
}
