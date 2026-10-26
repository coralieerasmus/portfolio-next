import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import GumballMachine, { type Gumball } from "@/components/projects/GumballMachine";
import ProjectFooter from "@/components/projects/ProjectFooter";
import { PROJECTS, type Media } from "@/content/projects";

// The "projects" page: a gumball machine. Every gumball is a project; turn
// the knob and a random one drops out. Underneath, a plain list of every
// project for anyone who'd rather pick one themselves.

export const metadata: Metadata = {
  title: "projects | Coralie Erasmus",
  description: "Turn the gumball machine for a random project by Coralie Erasmus.",
};

// The first picture of a project that actually exists in /public.
function coverImage(blocks: (typeof PROJECTS)[number]["blocks"]): Media | undefined {
  for (const b of blocks) {
    if (!("media" in b)) continue;
    for (const m of b.media) {
      if ((!m.type || m.type === "image") && fs.existsSync(path.join(process.cwd(), "public", m.src))) return m;
    }
  }
}

const navLink =
  "underline-offset-[3px] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black";

export default function ProjectsPage() {
  const balls: Gumball[] = PROJECTS.flatMap((p) => {
    const cover = coverImage(p.blocks);
    return cover ? [{ slug: p.slug, title: p.title, kind: p.kind, src: cover.src, alt: cover.alt }] : [];
  });

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#f7f7f7] text-black">
      <style>{"body{background:#f7f7f7}"}</style>

      <nav
        aria-label="Main"
        className="absolute right-6 top-[calc(env(safe-area-inset-top,0px)+16px)] z-10 flex gap-[18px] text-sm tracking-[-0.01em]"
      >
        <Link href="/projects" aria-current="page" className={`${navLink} font-semibold`}>
          projects
        </Link>
        <Link href="/about" className={navLink}>
          this is me
        </Link>
      </nav>

      <main className="mx-auto w-full max-w-[1200px] px-6 pt-[72px] md:px-10 md:pt-12">
        <h1 className="sr-only">Projects</h1>
        <GumballMachine balls={balls} />

        {/* Every project, for anyone who'd rather choose. */}
        <section className="mt-24 md:mt-32">
          <h2 className="border-b border-black pb-2 text-[11px] md:text-[14px]">or pick one yourself</h2>
          <ul>
            {PROJECTS.map((p) => (
              <li key={p.slug} className="border-b border-black">
                <Link
                  href={`/projects/${p.slug}`}
                  className="flex items-baseline justify-between gap-6 py-3 text-[14px] leading-[1.2] tracking-[-0.01em] hover:underline md:py-4 md:text-[clamp(16px,1.4vw,22px)]"
                >
                  <span>{p.title}</span>
                  <span className="shrink-0 text-[10px] uppercase md:text-[13px]">{p.kind}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <ProjectFooter />
    </div>
  );
}