"use client";

import { motion } from "framer-motion";
import { assetPath } from "@/lib/assets";
import { profile } from "@/lib/profile";
import Image from "next/image";

export function Dashboard() {
  return (
    <section id="about" className="relative z-10 min-h-screen bg-ink px-5 py-28 md:px-10 lg:px-16">
      <div className="mb-12 flex items-end justify-between border-b border-paper/15 pb-5">
        <div>
          <p className="eyebrow">02 / ABOUT ME</p>
          <h2 className="section-title">DESIGNER<br />DASHBOARD</h2>
        </div>
        <p className="hidden max-w-xs text-right text-xs leading-6 text-paper/50 md:block">
          A compact operating system for<br />design × AI × product.
        </p>
      </div>

      <div className="grid auto-rows-[minmax(150px,auto)] grid-cols-1 gap-3 md:grid-cols-12">
        <motion.div whileHover={{ y: -4 }} className="panel flex min-h-[520px] flex-col overflow-hidden !p-0 md:col-span-4 md:row-span-2">
          <div className="grid min-h-0 flex-1 grid-cols-[.88fr_1.12fr] gap-px bg-paper/15">
            <div className="relative bg-white">
              <Image
                src={assetPath(profile.portraits.formal)}
                alt={`${profile.name}职业证件照`}
                fill
                sizes="(max-width: 768px) 45vw, 15vw"
                className="object-contain object-center"
              />
              <span className="absolute bottom-3 left-3 rounded-full bg-ink/75 px-3 py-1 text-[9px] tracking-[.14em] text-paper backdrop-blur">PORTRAIT</span>
            </div>
            <div className="relative bg-[#d8d3cb]">
              <Image
                src={assetPath(profile.portraits.practice)}
                alt={`${profile.name}阅读中的职业形象照`}
                fill
                sizes="(max-width: 768px) 55vw, 19vw"
                className="object-cover object-center"
              />
              <span className="absolute bottom-3 left-3 rounded-full bg-ink/75 px-3 py-1 text-[9px] tracking-[.14em] text-paper backdrop-blur">IN PRACTICE</span>
            </div>
          </div>
          <div className="shrink-0 bg-blue px-7 py-6">
            <p className="text-3xl font-semibold">{profile.name}</p>
            <p className="mt-2 text-xs uppercase tracking-[.16em]">{profile.headline}</p>
            {profile.directions.length > 0 && <p className="mt-3 text-xs leading-6 text-paper/70">{profile.directions.join(" / ")}</p>}
          </div>
        </motion.div>

        <div className="panel md:col-span-8">
          <p className="eyebrow uppercase">HELLO, I&apos;M {profile.englishName || profile.name}.</p>
          <p className="mt-8 max-w-3xl whitespace-pre-line text-xl leading-relaxed md:text-3xl">{profile.about.heading}</p>
          {profile.about.introduction && <p className="mt-6 max-w-3xl whitespace-pre-line text-sm leading-7 text-paper/60">{profile.about.introduction}</p>}
          {(profile.about.industries || profile.about.interests) && <dl className="mt-6 grid gap-3 border-t border-paper/10 pt-5 text-xs leading-6 text-paper/55">
            {profile.about.industries && <div className="grid grid-cols-[64px_1fr] gap-3"><dt className="text-peach">专业方向</dt><dd>{profile.about.industries}</dd></div>}
            {profile.about.interests && <div className="grid grid-cols-[64px_1fr] gap-3"><dt className="text-peach">兴趣爱好</dt><dd>{profile.about.interests}</dd></div>}
          </dl>}
        </div>

        {profile.education.filter(item => !item.hidden).map((item, index) => <div key={item.id} className="panel md:col-span-4">
          <p className="eyebrow">EDUCATION / {String(index + 1).padStart(2, "0")}</p>
          <h3 className="mt-8 text-xl">{item.school}</h3>
          <p className="mt-2 text-sm leading-6 text-paper/55">{item.degree}<br />{item.time}{item.detail && <><br />{item.detail}</>}</p>
        </div>)}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:col-span-8">
          {profile.metrics.filter(item => !item.hidden).map((item) => (
            <div className="panel !p-5" key={item.id}>
              <strong className="font-display text-4xl text-peach md:text-5xl lg:text-6xl">{item.value}</strong>
              <p className="mt-5 text-[10px] leading-5 tracking-[.12em] text-paper/50">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="panel md:col-span-4">
          <p className="eyebrow">LANGUAGE</p>
          <p className="mt-7 text-lg">{profile.language.title}</p>
          {profile.language.detail && <p className="mt-2 text-sm text-paper/50">{profile.language.detail}</p>}
        </div>
        <div className="panel md:col-span-12">
          <p className="eyebrow">SYSTEM TAGS</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {profile.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-blue/40 bg-blue/10 px-4 py-2 text-xs text-blue transition hover:border-peach hover:text-peach">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
