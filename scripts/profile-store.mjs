import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const string = (value) => String(value ?? "").trim();
const list = (value) => (Array.isArray(value) ? value : string(value).split(/[\r\n,，]+/)).map(string).filter(Boolean);
const rows = (value, fields) => {
  if (!Array.isArray(value)) throw new Error("条目格式不正确，请刷新后重试。");
  return value.map((item) => ({ id: string(item.id) || randomUUID(), ...Object.fromEntries(fields.map((key) => [key, string(item[key])])), hidden: Boolean(item.hidden) }));
};

export function readProfile(root) {
  return JSON.parse(readFileSync(join(root, "data/profile.json"), "utf8"));
}

export function saveProfile(root, update) {
  if (!update || typeof update !== "object" || Array.isArray(update)) throw new Error("个人资料格式不正确。");
  const current = readProfile(root);
  const merged = { ...current, ...update };
  const profile = {
    ...Object.fromEntries(["name", "englishName", "headline", "location", "phone", "email"].map((key) => [key, string(merged[key])])),
    directions: list(merged.directions),
    portraits: { formal: string(update.portraits?.formal ?? current.portraits.formal), practice: string(update.portraits?.practice ?? current.portraits.practice) },
    about: Object.fromEntries(["heading", "introduction", "industries", "interests"].map((key) => [key, string((update.about ?? {})[key] ?? current.about[key])])),
    education: rows(merged.education, ["school", "degree", "time", "detail"]),
    language: { title: string(update.language?.title ?? current.language.title), detail: string(update.language?.detail ?? current.language.detail) },
    metrics: rows(merged.metrics, ["value", "label"]),
    tags: list(merged.tags),
    experiences: rows(merged.experiences, ["type", "time", "title", "detail"]),
    resume: { src: string(update.resume?.src ?? current.resume.src), label: string(update.resume?.label ?? current.resume.label) },
  };
  if (!profile.name || !profile.headline) throw new Error("请填写姓名和职业定位。");
  if (profile.experiences.some((item) => !["award", "research", "campus"].includes(item.type))) throw new Error("请选择有效的经历分类。");
  if (profile.experiences.some((item) => !item.hidden && !item.title)) throw new Error("请填写新增经历的名称，或将空白条目隐藏。");
  if (profile.education.some((item) => !item.hidden && !item.school)) throw new Error("请填写教育经历的学校，或将空白条目隐藏。");
  if (profile.metrics.some((item) => !item.hidden && (!item.value || !item.label))) throw new Error("请填写数据卡片的数字和说明，或将空白卡片隐藏。");
  for (const entries of [profile.education, profile.metrics, profile.experiences]) {
    if (new Set(entries.map((item) => item.id)).size !== entries.length) throw new Error("条目重复，请刷新后重试。");
  }
  if (!/^\/docs\/[a-z0-9/_-]+\.pdf$/i.test(profile.resume.src)) throw new Error("请通过下方按钮上传简历 PDF。");
  if (Object.values(profile.portraits).some((src) => !/^\/images\/[a-z0-9/_-]+\.(webp|png|jpe?g|avif)$/i.test(src))) throw new Error("请通过照片替换按钮选择图片。");
  const file = join(root, "data/profile.json");
  const backups = join(root, "tmp/profile-backups");
  mkdirSync(backups, { recursive: true });
  if (existsSync(file)) copyFileSync(file, join(backups, `profile-${Date.now()}-${randomUUID().slice(0, 8)}.json`));
  const temp = `${file}.tmp`;
  writeFileSync(temp, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  renameSync(temp, file);
  return profile;
}
