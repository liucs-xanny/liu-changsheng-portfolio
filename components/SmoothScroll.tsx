"use client";

import Lenis from "lenis";
import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;
    let frame = 0;
    let anchorFrame = 0;
    const raf = (time: number) => {
      lenis?.raf(time);
      frame = requestAnimationFrame(raf);
    };
    const configure = () => {
      cancelAnimationFrame(frame);
      lenis?.destroy();
      lenis = undefined;
      if (preference.matches) return;
      lenis = new Lenis({ duration: 0.75, smoothWheel: true, anchors: true });
      frame = requestAnimationFrame(raf);
    };
    configure();
    const restoreAnchor = () => {
      let id = "";
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      const target = id && document.getElementById(id);
      if (!target) return;
      cancelAnimationFrame(anchorFrame);
      anchorFrame = requestAnimationFrame(() => {
        if (lenis) { lenis.resize(); lenis.scrollTo(target, { immediate: true, offset: -90 }); }
        else target.scrollIntoView({ behavior: "instant", block: "start" });
      });
    };
    restoreAnchor();
    window.addEventListener("hashchange", restoreAnchor);
    preference.addEventListener("change", configure);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(anchorFrame);
      lenis?.destroy();
      preference.removeEventListener("change", configure);
      window.removeEventListener("hashchange", restoreAnchor);
    };
  }, []);
  return null;
}
