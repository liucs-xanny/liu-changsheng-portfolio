"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";

export function Cover() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pointerRatio = useRef(0.5);
  const seekFrame = useRef(0);
  const [videoReady, setVideoReady] = useState(false);
  const [star, setStar] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.12], [1, 0.96]);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <motion.section
      id="top"
      style={{ opacity, scale }}
      className="sticky top-0 h-screen overflow-hidden bg-[#221d17]"
      onPointerMove={(event) => {
        if (event.pointerType === "touch") return;
        const video = videoRef.current;
        if (!video || video.readyState < 2 || !Number.isFinite(video.duration)) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        pointerRatio.current = Math.max(
          0,
          Math.min(1, (event.clientX - bounds.left) / bounds.width),
        );

        if (seekFrame.current) return;
        seekFrame.current = requestAnimationFrame(() => {
          seekFrame.current = 0;
          const activeVideo = videoRef.current;
          if (!activeVideo || !Number.isFinite(activeVideo.duration)) return;

          const lastFrameTime = Math.max(0, activeVideo.duration - 1 / 30);
          activeVideo.pause();
          activeVideo.currentTime = pointerRatio.current * lastFrameTime;
        });
      }}
    >
      <div className="absolute inset-0">
        <Image
          src="/images/cover/character-clean.webp"
          alt="蓝色插画角色"
          fill
          priority
          className="object-cover"
        />
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          aria-label="眼睛跟随鼠标移动的蓝色插画角色"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${videoReady ? "opacity-100" : "opacity-0"}`}
          onLoadedData={() => {
            setVideoReady(true);
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = videoRef.current.duration / 2;
            }
          }}
        >
          <source src={`${basePath}/media/cover-gaze-hair-v4.mp4`} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-[#11100e]" />
      </div>

      <div className="absolute inset-x-5 top-24 flex items-start justify-between text-peach md:inset-x-12">
        <p className="font-display text-5xl tracking-[-.07em] md:text-8xl">2026</p>
        <p className="max-w-sm text-right text-xs leading-6 tracking-[.12em] md:text-base">
          AI产品体验设计
          <br />
          交互设计｜智能产品设计
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <h1 className="font-display text-[16vw] leading-none tracking-[-.09em] text-paper mix-blend-overlay">
          PORTFOLIO
        </h1>
      </div>

      <button
        aria-label="互动星星"
        onMouseEnter={() => setStar(true)}
        onMouseLeave={() => setStar(false)}
        className="absolute left-[26%] top-[44%] hidden h-24 w-24 md:block"
      >
        <motion.span
          animate={{ rotate: star ? 12 : 0, scale: star ? 1.15 : 1 }}
          className="block text-5xl text-peach"
          style={{ filter: star ? "drop-shadow(0 0 18px #ffb894)" : "drop-shadow(0 0 6px #ffb894)" }}
        >
          ✦
        </motion.span>
        {star && [0, 1, 2].map((dot) => (
          <motion.i
            key={dot}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: 1, x: (dot - 1) * 24, y: -18 - dot * 5 }}
            className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-peach"
          />
        ))}
      </button>

      <div className="absolute inset-x-5 bottom-7 flex items-end justify-between text-peach md:inset-x-12">
        <div>
          <p className="text-2xl font-semibold md:text-4xl">刘昌盛</p>
          <p className="mt-2 text-[10px] tracking-[.18em] opacity-80">AI PRODUCT EXPERIENCE DESIGNER</p>
        </div>
        <a href="#about" className="animate-pulse text-xs tracking-[.2em]">
          SCROLL TO EXPLORE ↓
        </a>
      </div>
    </motion.section>
  );
}
