"use client";

import { assetPath } from "@/lib/assets";
import { profile } from "@/lib/profile";
import Image from "next/image";
import { useEffect, useRef } from "react";

const width = 800;
const height = 450;
const columns = 3;
const framesPerSheet = 6;
const frameCount = 29;
const sheetCount = Math.ceil(frameCount / framesPerSheet);

function CoverGaze() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const preference = matchMedia("(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference)");
    const cover = canvas.closest("section");
    if (!cover) return;
    let active = false;
    let visible = false;
    let target = Math.floor(frameCount / 2);
    let drawn = -1;
    let raf = 0;
    let coverWidth = cover.clientWidth;
    let context: CanvasRenderingContext2D | null = null;
    let generation = 0;
    let sheets: (HTMLImageElement | undefined)[] = [];
    const requested = new Set<number>();

    const paint = () => {
      raf = 0;
      if (!active || !visible || document.hidden || drawn === target) return;
      const sheet = sheets[Math.floor(target / framesPerSheet)];
      if (!sheet) return;
      context ??= canvas.getContext("2d", { alpha: false });
      if (!context) return;
      const cell = target % framesPerSheet;
      context.drawImage(sheet, (cell % columns) * width, Math.floor(cell / columns) * height, width, height, 0, 0, width, height);
      drawn = target;
      canvas.dataset.ready = "true";
      canvas.dataset.frame = String(drawn);
    };
    const schedule = () => {
      if (!raf && active && visible && !document.hidden && drawn !== target) raf = requestAnimationFrame(paint);
    };
    const loadSheet = (index: number) => {
      if (requested.has(index)) return;
      requested.add(index);
      const current = generation;
      const sheet = new window.Image();
      sheet.fetchPriority = "low";
      sheet.src = assetPath(`/images/cover/gaze/sheet-${index}.webp`);
      sheet.decode().then(() => {
        if (!active || generation !== current) return;
        sheets[index] = sheet;
        schedule();
      }).catch(() => { /* The illustration remains available if media fails. */ });
    };
    const loadVisible = () => {
      if (!active || !visible || document.hidden) return;
      loadSheet(Math.floor(target / framesPerSheet));
      for (let i = 0; i < sheetCount; i++) loadSheet(i);
      schedule();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.intersectionRatio >= 0.25;
      loadVisible();
    }, { threshold: 0.25 });
    observer.observe(cover);
    const resize = new ResizeObserver(([entry]) => { coverWidth = entry.contentRect.width; });
    resize.observe(cover);
    const onMove = (event: PointerEvent) => {
      if (!active || !visible || event.pointerType === "touch") return;
      const ratio = Math.min(1, Math.max(0, event.clientX / Math.max(1, coverWidth - 1)));
      target = Math.round(ratio * (frameCount - 1));
      schedule();
    };
    const configure = () => {
      active = preference.matches;
      if (active) loadVisible();
      else {
        generation++;
        sheets = [];
        requested.clear();
        drawn = -1;
        delete canvas.dataset.ready;
        delete canvas.dataset.frame;
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    configure();
    cover.addEventListener("pointermove", onMove, { passive: true });
    preference.addEventListener("change", configure);
    document.addEventListener("visibilitychange", loadVisible);
    return () => {
      active = false;
      observer.disconnect();
      resize.disconnect();
      cancelAnimationFrame(raf);
      cover.removeEventListener("pointermove", onMove);
      preference.removeEventListener("change", configure);
      document.removeEventListener("visibilitychange", loadVisible);
    };
  }, []);
  return <canvas ref={ref} width={width} height={height} aria-hidden="true"
    className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-0 transition-opacity duration-200 data-[ready=true]:opacity-100 lg:object-center" />;
}

export function Cover() {
  return (
    <section id="top" className="cover-section relative h-[100svh] overflow-hidden bg-[#221d17]">
      <div className="absolute inset-0">
        <Image src={assetPath("/images/cover/character-clean.webp")} alt="蓝色插画角色" fill priority sizes="100vw"
          className="object-cover object-[70%_center] lg:object-center" />
        <CoverGaze />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-[#11100e]" />
      </div>
      <div className="absolute inset-x-5 top-24 flex items-start justify-between text-peach md:inset-x-12">
        <p className="font-display text-5xl tracking-[-.07em] md:text-8xl">2026</p>
        <p className="max-w-sm text-right text-xs leading-6 tracking-[.12em] md:text-base">{profile.directions.join(" / ")}</p>
      </div>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <h1 className="font-display text-[16vw] leading-none tracking-[-.09em] text-paper mix-blend-overlay">PORTFOLIO</h1>
      </div>
      <span aria-hidden="true" className="absolute left-[26%] top-[44%] hidden h-24 w-24 place-items-center text-5xl text-peach drop-shadow-[0_0_6px_#ffb894] motion-safe:transition-transform motion-safe:hover:rotate-12 motion-safe:hover:scale-110 md:grid">✦</span>
      <div className="absolute inset-x-5 bottom-7 flex items-end justify-between text-peach md:inset-x-12">
        <div>
          <p className="text-2xl font-semibold md:text-4xl">{profile.name}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[.18em] opacity-80">{profile.headline}</p>
        </div>
        <a href="#about" className="text-xs tracking-[.2em] transition-colors hover:text-paper">SCROLL TO EXPLORE ↓</a>
      </div>
    </section>
  );
}
