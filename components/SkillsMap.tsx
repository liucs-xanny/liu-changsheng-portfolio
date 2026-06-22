"use client";

import { projects } from "@/lib/projects";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const skills = [
  ["AI Product", ["yuandian", "shanyin"]],
  ["AI Agent", ["shanyin"]],
  ["Digital Human", ["yuandian"]],
  ["YOLO", ["nuclear-ai"]],
  ["UX Research", ["shanyin", "yueban"]],
  ["Service Design", ["shanyin", "yueban"]],
  ["Brand Experience", ["lechang", "zhijing"]],
  ["Industrial Design", ["medical-robot"]],
  ["AIGC", ["lechang", "yuandian", "zhijing"]],
] as const;

export function SkillsMap() {
  const [active, setActive] = useState(0);
  const related = projects.filter((project) => skills[active][1].includes(project.slug as never));
  return (
    <section id="skills" className="relative z-10 min-h-screen overflow-hidden bg-blue px-5 py-28 text-paper md:px-10 lg:px-16">
      <div className="mb-16"><p className="text-xs tracking-[.22em] text-paper/55">04 / SKILLS MAP</p><h2 className="section-title mt-5">DESIGN × AI<br />× PRODUCT</h2></div>
      <div className="grid gap-12 lg:grid-cols-[1.4fr_.6fr]">
        <div className="relative grid min-h-[520px] place-items-center rounded-[2rem] border border-paper/20 bg-ink/10 p-8">
          <div className="absolute h-56 w-56 rounded-full border border-paper/20" />
          <div className="absolute h-[430px] w-[430px] max-w-[82vw] rounded-full border border-dashed border-paper/20" />
          {skills.map(([skill], index) => {
            const angle = (index / skills.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 38;
            return <button key={skill} onClick={() => setActive(index)} style={{ left: `${50 + Math.cos(angle) * radius}%`, top: `${50 + Math.sin(angle) * radius}%` }} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-4 py-3 text-[10px] tracking-[.12em] transition md:text-xs ${active === index ? "scale-110 border-peach bg-peach text-ink shadow-[0_0_35px_rgba(255,184,148,.55)]" : "border-paper/30 bg-ink/60 hover:border-peach"}`}>{skill}</button>;
          })}
          <div className="z-10 grid h-36 w-36 place-items-center rounded-full bg-paper text-center text-xs font-bold tracking-[.14em] text-blue">LIU<br />CHANGSHENG</div>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs tracking-[.2em] text-paper/50">ACTIVE CAPABILITY</p>
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-6">
              <h3 className="font-display text-5xl">{skills[active][0]}</h3>
              <p className="mt-8 text-xs tracking-[.2em] text-paper/50">RELATED PROJECTS</p>
              <div className="mt-4 space-y-3">{related.map((project) => <Link key={project.slug} href={`/projects/${project.slug}/`} className="block rounded-2xl border border-paper/20 p-5 transition hover:bg-paper hover:text-blue"><span className="text-xs opacity-50">{project.index}</span><p className="mt-2 text-lg">{project.title}</p></Link>)}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
