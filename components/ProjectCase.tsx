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
      <section className="px-5 pb-12 pt-32 md:px-10 md:pt-40 lg:px-16">
        <div className="mb-8 flex items-center justify-between border-b border-paper/15 pb-5">
          <p className="eyebrow">{project.index} / SELECTED PROJECT</p>
          <a href="#project-materials" className="text-xs text-paper/55 transition hover:text-peach">直接看作品 ↓</a>
        </div>
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-16">
          <div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-[-.04em] md:text-6xl xl:text-7xl">{project.title}</h1>
            <dl className="mt-8 grid gap-5 border-y border-paper/15 py-6 sm:grid-cols-[.65fr_1fr]">
              <div><dt className="text-xs text-paper/40">起止时间</dt><dd className="mt-2 text-sm text-paper/85">{project.time || "—"}</dd></div>
              <div><dt className="text-xs text-paper/40">担任职位 / 负责内容</dt><dd className="mt-2 text-sm leading-6 text-peach">{project.role || "—"}</dd></div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">{project.tags.map((tag) => <span key={tag} className="rounded-full border border-paper/20 px-3 py-1.5 text-[11px] text-paper/65">{tag}</span>)}</div>
            {(project.overview || project.summary) && <div className="mt-8"><h2 className="text-xs tracking-wider text-paper/40">项目介绍</h2><p className="mt-3 max-w-2xl whitespace-pre-line text-base leading-8 text-paper/80">{project.overview || project.summary}</p></div>}
          </div>
          {project.cover && <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-paper/10 bg-white/[.035]"><Image src={assetPath(project.cover)} alt={`${project.title} 封面`} fill priority sizes="(max-width: 1024px) 100vw, 45vw" className="object-contain p-3" /></div>}
        </div>
      </section>
      <section id="project-materials" className="scroll-mt-24 px-5 pb-20 md:px-10 lg:px-16">
        <div className="mb-8 flex items-end justify-between border-t border-paper/15 pt-8"><h2 className="text-2xl md:text-4xl">项目作品</h2><p className="text-xs text-paper/40">图片可点击放大、旋转</p></div>
        <MediaGallery project={project} />
        {project.slug === "nuclear-ai" && project.gallery.length >= 3 && <details className="mt-10 rounded-2xl border border-paper/15 p-5 md:p-8"><summary className="cursor-pointer text-sm text-peach">交互演示 · 识别前后对比</summary><div className="mt-6 max-w-4xl"><NuclearCompare project={project} /></div></details>}
        {project.slug === "lechang" && <details className="mt-10 rounded-2xl border border-paper/15 p-5 md:p-8"><summary className="cursor-pointer text-sm text-peach">探索乐昌 · 品牌灵感地图</summary><div className="mt-6"><LechangMap project={project} /></div></details>}
      </section>
      <Link href={`/projects/${next.slug}/`} className="group block bg-blue px-5 py-16 md:px-10 lg:px-16"><p className="text-xs tracking-[.2em] text-paper/50">NEXT PROJECT / {next.index}</p><div className="mt-6 flex items-end justify-between gap-5"><h2 className="max-w-5xl text-3xl font-semibold transition group-hover:translate-x-2 md:text-6xl">{next.title}</h2><span className="text-4xl">↗</span></div></Link>
    </main>
  );
}
