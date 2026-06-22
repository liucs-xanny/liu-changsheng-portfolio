"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const items = [
  ["ABOUT", "#about"],
  ["WORK", "#work"],
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
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-5 mix-blend-difference md:px-10">
      <Link href={project ? "/" : "#top"} className="font-display text-sm tracking-[.22em] text-white">
        LCS® / 2026
      </Link>
      <button aria-label="Toggle menu" className="relative z-10 text-xs tracking-[.2em] text-white md:hidden" onClick={() => setOpen(!open)}>
        {open ? "CLOSE" : "MENU"}
      </button>
      <nav className={`${open ? "flex" : "hidden"} absolute inset-x-4 top-16 flex-col gap-5 rounded-2xl bg-black/90 p-6 text-xs tracking-[.2em] text-white backdrop-blur-xl md:static md:flex md:flex-row md:bg-transparent md:p-0`}>
        {project ? <Link href="/">INDEX</Link> : items.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
      </nav>
    </header>
  );
}
