import { assetPath } from "@/lib/assets";
import { profile } from "@/lib/profile";
import Image from "next/image";

const groups = [
  { type: "award", title: "获奖荣誉", label: "AWARDS" },
  { type: "research", title: "科研与专利", label: "RESEARCH & PATENTS" },
  { type: "campus", title: "校园经历", label: "CAMPUS EXPERIENCE" },
] as const;

export function ExperienceContact() {
  return (
    <>
      <section id="experience" className="relative z-10 scroll-mt-16 bg-paper px-5 py-28 text-ink md:px-10 lg:px-16">
        <p className="text-xs tracking-[.2em] text-ink/50">06 / EXPERIENCE & AWARDS</p>
        <h2 className="section-title mt-5">PROOF OF<br />PRACTICE</h2>
        <div className="mt-14 border-t border-ink/20">
          {groups.map((group) => {
            const entries = profile.experiences.filter((entry) => entry.type === group.type && !entry.hidden);
            if (!entries.length) return null;
            return <details key={group.type} open={group.type === "award"} className="group border-b border-ink/20">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 [&::-webkit-details-marker]:hidden"><span className="flex flex-wrap items-baseline gap-x-4 gap-y-2"><span className="text-xl font-semibold">{group.title}</span><span className="text-[10px] tracking-[.16em] text-ink/40">{group.label} / {entries.length}</span></span><span aria-hidden="true" className="text-2xl text-blue transition group-open:rotate-45">+</span></summary>
              <div className="pb-4">{entries.map((entry, index) => <article key={entry.id} className="grid gap-3 border-t border-ink/10 py-6 md:grid-cols-[.28fr_.65fr_1fr] md:gap-6"><span className="text-sm font-medium leading-7 text-blue">{entry.time || `${group.type === "award" ? "AWARD" : "RECORD"} ${String(index + 1).padStart(2, "0")}`}</span><h3 className="text-lg font-semibold leading-7">{entry.title}</h3><p className="whitespace-pre-line text-sm leading-7 text-ink/60">{entry.detail}</p></article>)}</div>
            </details>;
          })}
        </div>
      </section>
      <footer id="contact" className="relative z-10 min-h-screen overflow-hidden bg-ink px-5 py-28 md:px-10 lg:px-16">
        <Image src={assetPath("/images/cover/cover.webp")} alt="" fill className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-transparent" />
        <div className="relative flex min-h-[70vh] max-w-6xl flex-col justify-between">
          <div><p className="eyebrow">07 / CONTACT</p><h2 className="mt-8 max-w-5xl font-display text-[12vw] leading-[.82] tracking-[-.08em] md:text-[9vw]">LET&apos;S BUILD<br /><span className="text-blue">FUTURE</span> PRODUCTS<br />TOGETHER.</h2></div>
          <div className="mt-16 grid gap-8 border-t border-paper/15 pt-8 md:grid-cols-2">
            <div><p className="text-3xl">{profile.name}</p><p className="mt-2 text-sm text-paper/50">{profile.headline}<br />{profile.location}</p></div>
            <div className="flex flex-wrap items-start gap-3 md:justify-end">
              <a href={assetPath(profile.resume.src)} download className="contact-button">{profile.resume.label || "DOWNLOAD RESUME"}</a>
              <a href={`mailto:${profile.email}`} className="contact-button">SEND EMAIL</a>
              <a href="#top" className="contact-button">BACK TO TOP</a>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap justify-between gap-4 text-[10px] tracking-[.16em] text-paper/35"><span>{profile.phone}</span><span>{profile.email}</span><span>© 2026</span></div>
        </div>
      </footer>
    </>
  );
}
