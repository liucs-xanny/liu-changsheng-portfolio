export const projectCategories = ["AIGC影视", "AI产品", "视觉设计", "产品设计"] as const;
export type ProjectCategory = typeof projectCategories[number];

export function getProjectCategories(project: { categories?: string[]; slug: string; title: string; tags: string[] }): ProjectCategory[] {
  const selected = project.categories?.filter((name): name is ProjectCategory => projectCategories.includes(name as ProjectCategory));
  if (selected?.length) return selected;
  if (project.slug === "lechang") return ["AIGC影视", "视觉设计"];
  if (project.slug === "medical-robot") return ["产品设计"];
  if (project.slug === "zhijing") return ["视觉设计"];
  const text = `${project.title} ${project.tags.join(" ")}`;
  const result: ProjectCategory[] = [];
  if (/影视|影像|宣传片|短片|抽纱|AI视频|剪辑/.test(text)) result.push("AIGC影视");
  if (/agent|digital human|yolo|AI Companion|数字人|智能管理|AI宠物/i.test(text)) result.push("AI产品");
  if (/\bUI\b|brand|visual|packaging|品牌|视觉|平面/i.test(text)) result.push("视觉设计");
  if (/industrial|hardware|硬件设计|产品设计|结构设计/i.test(text) && project.slug !== "yueban") result.push("产品设计");
  return result.length ? result : ["AI产品"];
}
