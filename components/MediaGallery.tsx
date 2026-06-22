"use client";

import type { GalleryItem, Project } from "@/lib/projects";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const normalizeItem = (item: string | GalleryItem): GalleryItem =>
  typeof item === "string" ? { src: item, format: "landscape" } : item;

const cardClass = (format: GalleryItem["format"]) => {
  if (format === "portrait") return "md:col-span-2 aspect-[3/4]";
  if (format === "square") return "md:col-span-3 aspect-square";
  return "md:col-span-3 aspect-video";
};

export function MediaGallery({ project }: { project: Project }) {
  const mainItems = useMemo(() => project.gallery.map(normalizeItem), [project.gallery]);
  const allItems = useMemo(
    () => [
      ...mainItems,
      ...(project.mediaSections ?? []).flatMap((section) => section.items),
    ],
    [mainItems, project.mediaSections],
  );
  const [activeImage, setActiveImage] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const videos = project.videos ?? (project.video ? [{
    src: project.video,
    title: "项目演示视频",
    description: "项目过程与核心体验演示。",
  }] : []);

  useEffect(() => {
    if (activeImage === null) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveImage(null);
      if (event.key === "ArrowRight") setActiveImage((activeImage + 1) % allItems.length);
      if (event.key === "ArrowLeft") setActiveImage((activeImage - 1 + allItems.length) % allItems.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [activeImage, allItems.length]);

  const openImage = (item: GalleryItem) => {
    setRotation(0);
    setZoom(1);
    setActiveImage(allItems.findIndex((candidate) => candidate.src === item.src));
  };

  const renderGrid = (items: GalleryItem[]) => (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-6 md:items-start">
      {items.map((item, index) => (
        <button
          key={item.src}
          type="button"
          onClick={() => openImage(item)}
          className={`group relative overflow-hidden rounded-[2rem] border border-paper/15 bg-white/[.045] text-left ${cardClass(item.format)}`}
        >
          <Image
            src={item.src}
            alt={item.title ?? `${project.title} 项目资料 ${index + 1}`}
            fill
            sizes={item.format === "portrait" ? "(max-width: 768px) 100vw, 33vw" : "(max-width: 768px) 100vw, 50vw"}
            className="object-contain p-3 transition duration-500 group-hover:scale-[1.015]"
          />
          <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-5 pb-5 pt-16">
            <span>
              {item.title && <strong className="block text-sm font-medium text-paper">{item.title}</strong>}
              {item.description && <small className="mt-1 block max-w-md text-[10px] leading-5 text-paper/55">{item.description}</small>}
            </span>
            <span className="shrink-0 rounded-full bg-ink/85 px-4 py-2 text-[10px] tracking-[.12em] text-paper backdrop-blur">放大查看 ↗</span>
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-16">
      {videos.length > 0 && (
        <div className="grid gap-6">
          {videos.map((video) => (
            <article key={video.src} className="overflow-hidden rounded-[2rem] border border-paper/15 bg-[#181714]">
              <video
                controls
                playsInline
                preload="metadata"
                poster={video.poster ? `${basePath}${video.poster}` : `${basePath}${project.cover}`}
                className="aspect-video w-full bg-black object-contain"
              >
                <source src={`${basePath}${video.src}`} type="video/mp4" />
              </video>
              <div className="p-6 md:flex md:items-end md:justify-between">
                <h3 className="text-xl">{video.title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-paper/50 md:mt-0 md:text-right">{video.description}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {mainItems.length > 0 && (
        <section>
          <div className="mb-5 flex items-center justify-between">
            <p className="eyebrow">PROJECT MATERIALS / CLICK TO INSPECT</p>
            <p className="text-[10px] tracking-[.14em] text-paper/35">{mainItems.length} IMAGES</p>
          </div>
          {renderGrid(mainItems)}
        </section>
      )}

      {(project.mediaSections ?? []).map((section) => (
        <section key={section.title} className="border-t border-paper/15 pt-10">
          <p className="eyebrow">{section.eyebrow}</p>
          <div className="mb-7 mt-4 grid gap-4 md:grid-cols-[1fr_.8fr] md:items-end">
            <h3 className="text-3xl md:text-5xl">{section.title}</h3>
            <p className="text-sm leading-7 text-paper/55 md:text-right">{section.description}</p>
          </div>
          {renderGrid(section.items)}
        </section>
      ))}

      {project.document && (
        <a
          href={`${basePath}${project.document.src}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-[2rem] border border-paper/20 p-7 transition hover:border-peach hover:bg-peach hover:text-ink"
        >
          <div>
            <p className="text-xs tracking-[.16em] opacity-50">FULL PROJECT DOCUMENT</p>
            <p className="mt-3 text-xl">{project.document.label}</p>
          </div>
          <span className="text-3xl">↗</span>
        </a>
      )}

      <AnimatePresence>
        {activeImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] grid place-items-center bg-black/95 p-4 backdrop-blur-xl"
            onClick={() => setActiveImage(null)}
          >
            <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between md:left-8 md:right-8 md:top-6">
              <p className="text-xs tracking-[.14em] text-paper/50">
                {String(activeImage + 1).padStart(2, "0")} / {String(allItems.length).padStart(2, "0")}
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <button className="viewer-control" onClick={(event) => { event.stopPropagation(); setRotation((value) => value - 90); }}>↶ 旋转</button>
                <button className="viewer-control" onClick={(event) => { event.stopPropagation(); setRotation((value) => value + 90); }}>旋转 ↷</button>
                <button className="viewer-control" onClick={(event) => { event.stopPropagation(); setZoom((value) => value >= 2 ? 1 : value + 0.5); }}>放大</button>
                <button className="viewer-control" onClick={(event) => { event.stopPropagation(); setActiveImage(null); }}>关闭</button>
              </div>
            </div>

            <button
              aria-label="上一张"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-paper/20 bg-black/50 p-4 text-2xl md:left-8"
              onClick={(event) => {
                event.stopPropagation();
                setRotation(0);
                setZoom(1);
                setActiveImage((activeImage - 1 + allItems.length) % allItems.length);
              }}
            >←</button>
            <button
              aria-label="下一张"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-paper/20 bg-black/50 p-4 text-2xl md:right-8"
              onClick={(event) => {
                event.stopPropagation();
                setRotation(0);
                setZoom(1);
                setActiveImage((activeImage + 1) % allItems.length);
              }}
            >→</button>

            <motion.div
              className="relative h-[78vh] w-[86vw]"
              animate={{ rotate: rotation, scale: zoom }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={allItems[activeImage].src}
                alt={allItems[activeImage].title ?? `${project.title} 放大资料`}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
