import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

const isPages = process.env.GITHUB_ACTIONS === "true";
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const basePath = isPages && repo ? `/${repo}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

async function prepareImagePreviews() {
  const root = process.cwd();
  const imageRoot = resolve(root, "public/images");
  const destination = join(root, "public/image-previews");
  const read = async (name: string) => JSON.parse(await readFile(join(root, "data", name + ".json"), "utf8"));
  const [projects, studies, profile] = await Promise.all([read("projects"), read("studies"), read("profile")]);
  const jobs = new Map<string, { src: string; size: number }>();
  const queue = (src: unknown, size: number) => {
    if (typeof src === "string" && /^\/images\/.+\.(png|jpe?g|webp|avif)$/i.test(src)) {
      jobs.set(`${size}:${src}`, { src, size });
    }
  };
  for (const { cover, videos, hidden } of projects) {
    if (hidden) continue;
    queue(cover, 1280);
    for (const video of videos ?? []) queue(video.poster, 1280);
  }
  for (const { src, thumbnail, hidden } of studies) {
    if (hidden) continue;
    queue(src, 1280);
    queue(thumbnail || src, 320);
  }
  queue(profile.portraits?.formal, 800);
  queue(profile.portraits?.practice, 800);

  // Use Next's installed image encoder at build time, with no server/CDN at runtime.
  const requireFromNext = createRequire(require.resolve("next/package.json"));
  const sharp = requireFromNext("sharp");
  const previews: Record<string, string> = {};
  await mkdir(destination, { recursive: true });
  const kept = new Set<string>();
  for (const [key, { src, size }] of jobs) {
    const source = resolve(root, "public" + src);
    if (!source.startsWith(imageRoot + sep)) continue;
    try {
      const original = await readFile(source);
      if (original.length <= (size === 320 ? 32 : 110) * 1024) continue;
      const optimized: Buffer = await sharp(original).rotate().resize(size, size, { fit: "inside", withoutEnlargement: true })
        .webp({quality: size === 320 ? 74 : 83}).toBuffer();
      if (optimized.length >= original.length * 0.8) continue;
      const file = createHash("sha256").update(optimized).digest("hex").slice(0, 24) + ".webp";
      await writeFile(join(destination, file), optimized);
      kept.add(file);
      previews[key] = `/image-previews/${file}`;
    } catch { /* Keep the original URL if a source cannot be optimized. */ }
  }
  for (const name of await readdir(destination)) {
    if (/^[a-f0-9]{24}\.webp$/.test(name) && !kept.has(name)) await rm(join(destination, name), { force: true });
  }
  console.log(`Image previews: ${Object.keys(previews).length} lightweight variants prepared.`);
  return previews;
}

export default async function config(phase: string): Promise<NextConfig> {
  if (phase !== PHASE_PRODUCTION_BUILD && phase !== PHASE_DEVELOPMENT_SERVER) return nextConfig;
  try {
    const previews = await prepareImagePreviews();
    return { ...nextConfig, env: { ...nextConfig.env, NEXT_PUBLIC_IMAGE_PREVIEWS: JSON.stringify(previews) } };
  } catch (error) {
    console.warn("Could not generate lightweight image previews; using originals.", error);
    return nextConfig;
  }
}
