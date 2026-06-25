import type { Metadata } from "next";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";

const repository = process.env.GITHUB_REPOSITORY;
const githubPagesUrl = repository ? `https://${repository.split("/")[0]}.github.io/${repository.split("/")[1]}` : undefined;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? githubPagesUrl ?? "http://localhost:3000"),
  title: "刘昌盛｜AI Product Experience Designer",
  description: "刘昌盛个人交互式网页作品集：AI产品体验、数字人、AI Agent、计算机视觉、服务设计、品牌体验与工业设计。",
  keywords: ["刘昌盛", "AI产品设计", "交互设计", "UI UX", "数字人", "AI Agent", "服务设计"],
  authors: [{ name: "刘昌盛" }],
  openGraph: {
    title: "刘昌盛｜AI Product Experience Designer",
    description: "Design × AI × Product — Interactive Portfolio 2026",
    images: ["/images/cover/cover.webp"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body><SmoothScroll />{children}</body></html>;
}
