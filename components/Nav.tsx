"use client";

import Link from "next/link";
import { assetPath } from "@/lib/assets";
import { useEffect, useState } from "react";

const items = [
  ["ABOUT", "#about"],
  ["WORK", "#work"],
  ["VISUAL NOTES", "#visual-notes"],
  ["SKILLS", "#skills"],
  ["CONTACT", "#contact"],
];

export function Nav({ project = false }: { project?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-paper/10 bg-ink/95 px-5 py-5 md:px-10">
      <Link href={project ? "/" : "#top"} className="font-display text-sm tracking-[.22em] text-white">
        LCS® / 2026
      </Link>
      {project && <a href={assetPath("/#work")} className="rounded-full bg-peach px-5 py-2.5 text-sm font-semibold text-ink">返回项目列表</a>}
      <button aria-label="Toggle menu" aria-expanded={open} className={`relative z-10 text-xs tracking-[.2em] text-white lg:hidden ${project ? "hidden" : ""}`} onClick={() => setOpen(!open)}>
        {open ? "CLOSE" : "MENU"}
      </button>
      {!project && <nav className={`${open ? "flex" : "hidden"} absolute inset-x-4 top-16 flex-col gap-5 rounded-2xl bg-black/90 p-6 text-xs tracking-[.2em] text-white backdrop-blur-xl lg:static lg:flex lg:flex-row lg:bg-transparent lg:p-0`}>
        {items.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>)}
      </nav>}
    </header>
  );
}
