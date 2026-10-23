import { Cover } from "@/components/Cover";
import { Dashboard } from "@/components/Dashboard";
import { ExperienceContact } from "@/components/ExperienceContact";
import { Nav } from "@/components/Nav";
import { ProjectArchive } from "@/components/ProjectArchive";
import { SkillsMap } from "@/components/SkillsMap";
import { VisualStudies } from "@/components/VisualStudies";

export default function Home() {
  return <main><Nav /><Cover /><Dashboard /><ProjectArchive /><VisualStudies /><SkillsMap /><ExperienceContact /></main>;
}
