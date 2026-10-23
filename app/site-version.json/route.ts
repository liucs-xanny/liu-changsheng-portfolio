import { projects } from "@/lib/projects";

export const dynamic = "force-static";

export function GET() {
  return Response.json({ commit: process.env.GITHUB_SHA || null, builtAt: new Date().toISOString(), projectCount: projects.length });
}
