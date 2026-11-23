"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { assetPath } from "@/lib/assets";
import { profile } from "@/lib/profile";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function Cover() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pointerRatio = useRef(0.5);
  const reduceMotion = useReducedMotion();
  const [videoReady, setVideoReady] = useState(false);
  const [star, setStar] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.12], [1, 0.96]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) return;
    let frame = 0;
    let disposed = false;
    let seeking = false;
    let firstFrame = true;
    const reveal = () => { if (!disposed) setVideoReady(true); };
    const seek = () => {
      frame = 0;
      if (disposed || seeking || video.readyState < 1 || !Number.isFinite(video.duration)) return;
      const target = pointerRatio.current * Math.max(0, video.duration - 1 / 30);
      if (Math.abs(video.currentTime - target) < 1 / 60 && !firstFrame) return;
      // Decode one frame at a time, then seek to the latest pointer position.
      // Repeated pointer events must not cancel an in-flight decode.
      seeking = true;
      firstFrame = false;
      video.pause();
      video.currentTime = target;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(seek); };
    const decoded = () => { seeking = false; reveal(); schedule(); };
    const ready = () => { if (!seeking) schedule(); };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      // Remember movements before media is ready; never autoplay the clip.
      pointerRatio.current = Math.max(0, Math.min(1, event.clientX / window.innerWidth));
      schedule();
    };
    const resume = () => {
      seeking = video.seeking;
      if (video.readyState === 0) video.load();
      else ready();
    };
    video.addEventListener("loadedmetadata", ready);
    video.addEventListener("loadeddata", ready);
    video.addEventListener("canplay", ready);
    video.addEventListener("seeked", decoded);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pageshow", resume);
    // Hydration may run after a cached loadeddata event. Check readiness too.
    if (video.readyState >= 1) ready();
    else video.load();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      video.removeEventListener("loadedmetadata", ready);
      video.removeEventListener("loadeddata", ready);
      video.removeEventListener("canplay", ready);
      video.removeEventListener("seeked", decoded);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pageshow", resume);
    };
  }, [reduceMotion]);

  return (
    <motion.section
      id="top"
      style={reduceMotion ? undefined : { opacity, scale }}
      className="sticky top-0 h-screen overflow-hidden bg-[#221d17]"
    >
      <div className="absolute inset-0">
        <Image
          src={assetPath("/images/cover/character-clean.webp")}
          alt="蓝色插画角色"
          fill
          priority
          className="object-cover object-[70%_center] lg:object-center"
        />
        <video
          ref={videoRef}
          muted
          playsInline
          preload={reduceMotion ? "none" : "auto"}
          aria-label="眼睛跟随鼠标移动的蓝色插画角色"
          className={`absolute inset-0 h-full w-full object-cover object-[70%_center] transition-opacity duration-300 lg:object-center ${videoReady && !reduceMotion ? "opacity-100" : "opacity-0"}`}
          onError={() => setVideoReady(false)}
        >
          <source src={assetPath("/media/cover-gaze-hair-v4.mp4")} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-[#11100e]" />
      </div>

      <div className="absolute inset-x-5 top-24 flex items-start justify-between text-peach md:inset-x-12">
        <p className="font-display text-5xl tracking-[-.07em] md:text-8xl">2026</p>
        <p className="max-w-sm text-right text-xs leading-6 tracking-[.12em] md:text-base">
          {profile.directions.join(" / ")}
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
          <p className="text-2xl font-semibold md:text-4xl">{profile.name}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[.18em] opacity-80">{profile.headline}</p>
        </div>
        <a href="#about" className="text-xs tracking-[.2em] transition-colors hover:text-paper">
          SCROLL TO EXPLORE ↓
        </a>
      </div>
    </motion.section>
  );
}
