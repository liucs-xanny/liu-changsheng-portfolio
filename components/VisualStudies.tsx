"use client";

import { assetPath } from "@/lib/assets";
import { studies, type Study } from "@/lib/studies";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const number = (value: number) => String(value).padStart(2, "0");

function StudyViewer({ items, index, onChange, onClose }: {
  items: Study[];
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const item = items[index];

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => { setZoom(1); setRotation(0); }, [index]);

  return (
    <dialog
      ref={dialog}
      className="study-viewer"
      aria-label={`查看作品：${item.title}`}
      data-lenis-prevent
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") { event.preventDefault(); onChange((index - 1 + items.length) % items.length); }
        if (event.key === "ArrowRight") { event.preventDefault(); onChange((index + 1) % items.length); }
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper/15 px-4 py-4 md:px-8">
        <div><p className="text-[10px] tracking-widest text-peach">VISUAL NOTES / {number(index + 1)} OF {number(items.length)}</p><h3 className="mt-1 text-sm">{item.title}</h3></div>
        <div className="flex flex-wrap gap-2">
          <button className="viewer-control" onClick={() => setZoom(zoom >= 2.5 ? 1 : zoom + .5)}>{zoom > 1 ? `${zoom}× · 继续放大` : "放大"}</button>
          <button className="viewer-control" onClick={() => setRotation(rotation + 90)}>旋转 ↷</button>
          <a className="viewer-control" href={assetPath(item.src)} target="_blank" rel="noreferrer">查看原图 ↗</a>
          <button className="viewer-control" onClick={onClose}>关闭 ✕</button>
        </div>
      </div>
      <div className="study-viewer-canvas" data-lenis-prevent>
        <div className="relative mx-auto" style={{ width: `${zoom * 82}vw`, height: `${zoom * 72}vh`, minWidth: "82vw" }}>
          <Image src={assetPath(item.src)} alt={item.title} fill sizes={`${zoom * 85}vw`} className="object-contain" style={{ transform: `rotate(${rotation}deg)` }} />
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-4 md:px-8">
        <button className="viewer-control" onClick={() => onChange((index - 1 + items.length) % items.length)}>← 上一张</button>
        <p className="hidden text-xs text-paper/40 sm:block">方向键切换 · ESC 关闭</p>
        <button className="viewer-control" onClick={() => onChange((index + 1) % items.length)}>下一张 →</button>
      </div>
    </dialog>
  );
}

export function VisualStudies() {
  const section = useRef<HTMLElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<number | null>(null);
  const swipe = useRef(false);
  const reducedMotion = useReducedMotion();
  const [category, setCategory] = useState("全部");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const items = category === "全部" ? studies : studies.filter((item) => item.category === category);
  const categories = ["全部", ...Array.from(new Set(studies.map((item) => item.category)))];
  const activeIndex = Math.min(index, items.length - 1);
  const current = items[activeIndex];
  const move = useCallback((direction: number) => setIndex((value) => (value + direction + items.length) % items.length), [items.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .2 });
    if (section.current) observer.observe(section.current);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  useEffect(() => {
    if (!playing || hovered || focused || !visible || !pageVisible || reducedMotion || viewerIndex !== null || items.length < 2) return;
    const timer = window.setTimeout(() => move(1), 6000);
    return () => window.clearTimeout(timer);
  }, [index, playing, hovered, focused, visible, pageVisible, reducedMotion, viewerIndex, items.length, move]);

  useEffect(() => {
    const selected = strip.current?.children[activeIndex] as HTMLElement | undefined;
    if (selected && strip.current) strip.current.scrollTo({ left: selected.offsetLeft - strip.current.clientWidth / 2 + selected.clientWidth / 2, behavior: reducedMotion ? "instant" : "smooth" });
  }, [activeIndex, category, reducedMotion]);

  if (!current) return null;
  const positions = items.length > 2 ? [-1, 0, 1] : items.length === 2 ? [0, 1] : [0];

  return (
    <section ref={section} id="visual-notes" className="visual-notes relative overflow-hidden py-20 md:py-28"
      onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="px-5 md:px-10 lg:px-16">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div><p className="eyebrow">04 / BEYOND THE PROJECTS</p><h2 className="mt-5 font-display text-5xl leading-[.92] tracking-[-.06em] md:text-8xl">VISUAL<br /><span className="text-paper/35">NOTES.</span></h2></div>
          <div className="max-w-xs"><p className="text-xl">视觉手记</p><p className="mt-3 text-sm leading-7 text-paper/50">项目之外，也保持对形态、材质与画面的好奇。<br />一些日常渲染、建模与视觉设计。</p></div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-paper/15 pt-6">
          <div className="flex flex-wrap gap-2" aria-label="作品分类">{categories.map((name) => <button key={name} aria-pressed={category === name} onClick={() => { setCategory(name); setIndex(0); }} className={`rounded-full border px-4 py-2 text-xs transition ${category === name ? "border-peach bg-peach text-ink" : "border-paper/15 text-paper/55 hover:border-paper/50 hover:text-paper"}`}>{name}</button>)}</div>
          <span className="text-[10px] tracking-[.16em] text-paper/35">{number(items.length)} COLLECTED PIECES</span>
        </div>
      </div>

      <div className="study-stage mt-6" role="region" aria-roledescription="carousel" aria-label="日常作品画廊"
        onPointerDown={(event) => { pointerStart.current = event.clientX; swipe.current = false; }}
        onPointerUp={(event) => {
          if (pointerStart.current !== null && Math.abs(event.clientX - pointerStart.current) > 45) { swipe.current = true; move(event.clientX < pointerStart.current ? 1 : -1); }
          pointerStart.current = null;
        }} onPointerCancel={() => { pointerStart.current = null; }}>
        {positions.map((position) => {
          const itemIndex = (activeIndex + position + items.length) % items.length;
          const item = items[itemIndex];
          return <motion.button key={item.id} type="button" className="study-slide" tabIndex={position === 0 ? 0 : -1}
            initial={false} animate={{ x: `${-50 + position * 82}%`, scale: position === 0 ? 1 : .86, opacity: position === 0 ? 1 : .42 }}
            transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 135, damping: 26 }}
            style={{ zIndex: position === 0 ? 3 : 1 }} aria-label={position === 0 ? `放大查看：${item.title}` : `${position < 0 ? "上一张" : "下一张"}：${item.title}`}
            onClick={() => { if (swipe.current) { swipe.current = false; return; } if (position) move(position); else setViewerIndex(activeIndex); }}>
            <Image src={assetPath(item.src)} alt={item.title} fill sizes="(max-width: 768px) 88vw, 68vw" className={position === 0 ? "object-contain p-3 md:p-6" : "object-cover"} draggable={false} />
            {position === 0 && <span className="absolute bottom-4 right-4 rounded-full border border-paper/15 bg-black/70 px-4 py-2 text-[10px] backdrop-blur-md">点击放大 ↗</span>}
          </motion.button>;
        })}
      </div>

      <div className="px-5 md:px-10 lg:px-16">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-5 border-b border-paper/15 pb-6 pt-2">
          <div className="flex items-start gap-5"><span className="font-mono text-xs text-peach">{number(activeIndex + 1)} <span className="text-paper/25">/ {number(items.length)}</span></span><div><h3 className="text-lg md:text-2xl">{current.title}</h3><p className="mt-2 text-xs text-paper/40">{current.category}</p></div></div>
          <div className="flex items-center gap-2">
            <button className="study-control" aria-label="上一张作品" onClick={() => move(-1)}>←</button>
            <button className="study-control !w-auto px-4 !text-xs" aria-label={playing ? "暂停自动轮播" : "开启自动轮播"} aria-pressed={playing} onClick={() => setPlaying(!playing)}>{playing ? "Ⅱ 暂停" : "▷ 播放"}</button>
            <button className="study-control" aria-label="下一张作品" onClick={() => move(1)}>→</button>
          </div>
        </div>
        <div ref={strip} className="study-strip relative mx-auto mt-6 flex max-w-5xl gap-3 overflow-x-auto pb-3" data-lenis-prevent>
          {items.map((item, itemIndex) => <button key={item.id} aria-label={`选择作品：${item.title}`} aria-pressed={itemIndex === activeIndex} onClick={() => setIndex(itemIndex)} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition md:h-20 md:w-32 ${itemIndex === activeIndex ? "border-peach opacity-100" : "border-paper/10 opacity-35 hover:opacity-80"}`}><Image src={assetPath(item.thumbnail || item.src)} alt="" fill sizes="128px" className="object-cover" /></button>)}
        </div>
      </div>
      {viewerIndex !== null && <StudyViewer items={items} index={viewerIndex} onChange={setViewerIndex} onClose={() => setViewerIndex(null)} />}
    </section>
  );
}
