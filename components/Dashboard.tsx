"use client";

import { motion } from "framer-motion";
import { assetPath } from "@/lib/assets";
import Image from "next/image";

const tags = ["AI Agent", "Digital Human", "RAG", "YOLO", "UX Research", "Service Design", "Brand Experience", "Industrial Design", "AIGC"];

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
                src={assetPath("/images/cover/portrait.webp")}
                alt="刘昌盛职业证件照"
                fill
                sizes="(max-width: 768px) 45vw, 15vw"
                className="object-contain object-center"
              />
              <span className="absolute bottom-3 left-3 rounded-full bg-ink/75 px-3 py-1 text-[9px] tracking-[.14em] text-paper backdrop-blur">PORTRAIT</span>
            </div>
            <div className="relative bg-[#d8d3cb]">
              <Image
                src={assetPath("/images/cover/portrait-reading.webp")}
                alt="刘昌盛阅读中的职业形象照"
                fill
                sizes="(max-width: 768px) 55vw, 19vw"
                className="object-cover object-center"
              />
              <span className="absolute bottom-3 left-3 rounded-full bg-ink/75 px-3 py-1 text-[9px] tracking-[.14em] text-paper backdrop-blur">IN PRACTICE</span>
            </div>
          </div>
          <div className="shrink-0 bg-blue px-7 py-6">
            <p className="text-3xl font-semibold">刘昌盛</p>
            <p className="mt-2 text-xs tracking-[.16em]">AI PRODUCT EXPERIENCE DESIGNER</p>
          </div>
        </motion.div>

        <div className="panel md:col-span-8">
          <p className="eyebrow">HELLO, I&apos;M LIU CHANGSHENG.</p>
          <p className="mt-8 max-w-3xl text-xl leading-relaxed md:text-3xl">
            广东工业大学工业设计工程专业硕士研究生，研究方向为人工智能与设计创新。
          </p>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-paper/60">
            我关注人工智能技术如何转化为真实、易用并具有情感价值的产品体验，并持续探索 AI Agent、数字人、计算机视觉、服务设计与品牌体验在真实场景中的应用。
          </p>
        </div>

        <div className="panel md:col-span-4">
          <p className="eyebrow">EDUCATION / 01</p>
          <h3 className="mt-8 text-xl">广东工业大学</h3>
          <p className="mt-2 text-sm text-paper/55">工业设计工程 硕士<br />2025.09—2028.06</p>
        </div>
        <div className="panel md:col-span-4">
          <p className="eyebrow">EDUCATION / 02</p>
          <h3 className="mt-8 text-xl">福州大学至诚学院</h3>
          <p className="mt-2 text-sm text-paper/55">工业设计 本科｜专业排名前5%<br />2021.09—2025.06</p>
        </div>

        <div className="grid grid-cols-3 gap-3 md:col-span-7">
          {[["6+", "核心项目"], ["1", "国家级一等奖"], ["3+", "AI方向项目"]].map(([value, label]) => (
            <div className="panel !p-5" key={label}>
              <strong className="font-display text-4xl text-peach md:text-6xl">{value}</strong>
              <p className="mt-5 text-[10px] tracking-[.16em] text-paper/50">{label}</p>
            </div>
          ))}
        </div>
        <div className="panel md:col-span-5">
          <p className="eyebrow">LANGUAGE</p>
          <p className="mt-7 text-lg">CET-4 / CET-6</p>
          <p className="mt-2 text-sm text-paper/50">CET-6 Speaking B+</p>
        </div>
        <div className="panel md:col-span-12">
          <p className="eyebrow">SYSTEM TAGS</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-blue/40 bg-blue/10 px-4 py-2 text-xs text-blue transition hover:border-peach hover:text-peach">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
