"use client";

import { assetPath } from "@/lib/assets";
import { useRef, useState } from "react";
import Image from "next/image";

export function ProjectVideo({ src, title, description, poster }: {
  src: string; title: string; description?: string; poster: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [waiting, setWaiting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [started, setStarted] = useState(false);
  const url = assetPath(src);
  return (
    <article className="overflow-hidden rounded-[2rem] border border-paper/15 bg-[#181714]">
      <div className="relative">
        <video ref={ref} controls={started} playsInline preload="none" poster={assetPath(poster)}
          aria-label={title} data-project-video
          className="aspect-video w-full bg-black object-contain"
          onPlay={() => {
            document.querySelectorAll<HTMLVideoElement>("video[data-project-video]").forEach(video => {
              if (video !== ref.current) video.pause();
            });
          }}
          onWaiting={() => setWaiting(true)} onStalled={() => setWaiting(true)}
          onPlaying={() => { setWaiting(false); setFailed(false); }}
          onCanPlay={() => setWaiting(false)} onPause={() => setWaiting(false)}
          onError={() => { setWaiting(false); setFailed(true); }}
          src={url}
        />
        {!started && <button type="button" aria-label={`播放视频：${title}`} className="group absolute inset-0 grid place-items-center overflow-hidden bg-black" onClick={() => {
          setStarted(true);
          setFailed(false);
          ref.current?.play().catch(() => { setWaiting(false); setFailed(true); });
        }}>
          <Image src={assetPath(poster)} alt="" fill sizes="(max-width: 768px) 100vw, 90vw" className="object-contain" />
          <span className="relative rounded-full border border-paper/40 bg-black/75 px-6 py-3 text-sm font-semibold text-paper shadow-lg transition group-hover:border-peach group-hover:text-peach">点击播放</span>
        </button>}
        {waiting && !failed && <p role="status" className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/80 px-4 py-2 text-sm text-paper">正在缓冲，也可下载后观看</p>}
      </div>
      <div className="space-y-4 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl"><h3 className="text-xl">{title}</h3>{description && <p className="mt-2 text-sm leading-7 text-paper/70">{description}</p>}</div>
          <a href={url} download={src.split("/").pop()?.split("?")[0] || "project-video.mp4"}
            className="shrink-0 rounded-full bg-peach px-5 py-3 text-sm font-semibold text-ink transition hover:bg-paper"
            aria-label={`下载视频：${title}`}>下载视频</a>
        </div>
        <p className="text-sm leading-6 text-paper/55">可在线播放；网络较慢时，建议下载完成后在本地观看。下载耗时取决于文件大小和网络。</p>
        {failed && <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-peach/30 p-4 text-sm text-peach"><p>视频暂时无法播放，可下载观看，或</p><button className="underline underline-offset-4" onClick={() => { setFailed(false); ref.current?.load(); }}>重新加载视频</button></div>}
      </div>
    </article>
  );
}
