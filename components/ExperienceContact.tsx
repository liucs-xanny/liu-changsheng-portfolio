import Image from "next/image";

const timeline = [
  ["2026", "全国总决赛一等奖", "中国好创意·原点新城数字人赛道"],
  ["2026", "发明专利筹备", "核电金属构件损伤生成、标注与识别方法"],
  ["2025", "软件著作权", "“悦伴”母婴全周期服务设计APP"],
  ["2025—至今", "研究生学生会宣传部", "广东工业大学"],
  ["2021—2023", "学生会宣传部负责人", "福州大学至诚学院传媒与设计系"],
];

export function ExperienceContact() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <>
      <section className="relative z-10 bg-paper px-5 py-28 text-ink md:px-10 lg:px-16">
        <p className="text-xs tracking-[.2em] text-ink/50">05 / EXPERIENCE & AWARDS</p>
        <h2 className="section-title mt-5">PROOF OF<br />PRACTICE</h2>
        <div className="mt-16 border-t border-ink/20">
          {timeline.map(([year, title, detail], index) => <div key={title} className="grid gap-4 border-b border-ink/20 py-7 md:grid-cols-[.25fr_.55fr_1fr]"><span className="font-display text-xl text-blue">{year}</span><strong className="text-xl">{title}</strong><span className="text-sm text-ink/55">{detail}</span><span className="hidden">{index}</span></div>)}
        </div>
      </section>
      <footer id="contact" className="relative z-10 min-h-screen overflow-hidden bg-ink px-5 py-28 md:px-10 lg:px-16">
        <Image src="/images/cover/cover.webp" alt="" fill className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-transparent" />
        <div className="relative flex min-h-[70vh] max-w-6xl flex-col justify-between">
          <div><p className="eyebrow">06 / CONTACT</p><h2 className="mt-8 max-w-5xl font-display text-[12vw] leading-[.82] tracking-[-.08em] md:text-[9vw]">LET&apos;S BUILD<br /><span className="text-blue">FUTURE</span> PRODUCTS<br />TOGETHER.</h2></div>
          <div className="mt-16 grid gap-8 border-t border-paper/15 pt-8 md:grid-cols-2">
            <div><p className="text-3xl">刘昌盛</p><p className="mt-2 text-sm text-paper/50">AI Product Experience Designer<br />Guangzhou</p></div>
            <div className="flex flex-wrap items-start gap-3 md:justify-end">
              <a href={`${basePath}/docs/resume.pdf`} download className="contact-button">DOWNLOAD RESUME</a>
              <a href="mailto:858572182@qq.com" className="contact-button">SEND EMAIL</a>
              <a href="#top" className="contact-button">BACK TO TOP</a>
            </div>
          </div>
          <div className="mt-12 flex justify-between text-[10px] tracking-[.16em] text-paper/35"><span>18900691231</span><span>858572182@QQ.COM</span><span>© 2026</span></div>
        </div>
      </footer>
    </>
  );
}
