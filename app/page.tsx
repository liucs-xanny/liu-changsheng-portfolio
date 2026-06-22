import { Cover } from "@/components/Cover";
import { Dashboard } from "@/components/Dashboard";
import { ExperienceContact } from "@/components/ExperienceContact";
import { Nav } from "@/components/Nav";
import { ProjectArchive } from "@/components/ProjectArchive";
import { SkillsMap } from "@/components/SkillsMap";

export default function Home() {
  return <main><Nav /><Cover /><Dashboard /><ProjectArchive /><SkillsMap /><ExperienceContact /></main>;
}
