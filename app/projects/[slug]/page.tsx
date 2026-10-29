import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import ProjectFooter from "@/components/projects/ProjectFooter";
import ProjectMedia from "@/components/projects/ProjectMedia";
import ScrollReveal, { Words } from "@/components/projects/ScrollReveal";
import { getProject, PROJECTS, type Block, type Media } from "@/content/projects";

// One page per project in content/projects.ts, at /projects/<slug>.
//
// PHONES follow the wireframes: everything centred in one column, each
// image at its wireframe width.
// DESKTOP uses a 12-column grid built from the same content:
//   - a big left-aligned title with the year and tags beside it
//   - the first image as the opener: edge to edge if it's landscape, or
//     standing next to the title if it's portrait
//   - after that, each image alternates left / right, with its paragraph
//     centred in the free space next to it (and centred against the image's height)

type MediaBlock = Extract<Block, { media: Media[] }>;
// at = position in projects.ts (used to keep the phone order).
type Row = { block: MediaBlock; at: number; text?: string; textAt?: number };

export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return { title: `${project.title} | Coralie Erasmus`, description: project.title };
}

// Each image block plus the paragraph that goes next to it on desktop: the
// paragraph after it, or (with textBesideNext) the paragraph before it.
// A paragraph left over at the end (no image for it) comes back as "tail"
// and gets its own centred line under the last image.
function toRows(blocks: Block[], textBesideNext = false): { rows: Row[]; tail?: { text: string; at: number } } {
  const rows: Row[] = [];
  let waiting: { text: string; at: number } | undefined;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if ("media" in b) {
      rows.push({ block: b, at: i, text: waiting?.text, textAt: waiting?.at });
      waiting = undefined;
    } else if (textBesideNext) {
      waiting = { text: b.text, at: i };
    } else if (rows.length && !rows[rows.length - 1].text) {
      rows[rows.length - 1].text = b.text;
      rows[rows.length - 1].textAt = i;
    } else {
      waiting = { text: b.text, at: i };
    }
  }
  // A paragraph left over at the very end goes with the last image.
  const last = rows[rows.length - 1];
  if (waiting && last && !last.text) {
    last.text = waiting.text;
    last.textAt = waiting.at;
    waiting = undefined;
  }
  return { rows, tail: waiting };
}

// Desktop grid spot: column start, width in columns, row, rows tall.
const at = (col: number, span: number, row: number, rows = 1) =>
  ({ "--c": col, "--s": span, "--r": row, "--rs": rows }) as CSSProperties;
const place = "md:[grid-column:var(--c)/span_var(--s)] md:[grid-row:var(--r)/span_var(--rs)]";

// Width on phones from the wireframe (402px wide), as a % of the screen.
const pct = (px: number) => `${(px / 402) * 100}%`;

// How many of the 12 desktop columns an image block gets.
function desktopSpan(block: MediaBlock) {
  if (block.media.length === 2) return block.gap === undefined ? 12 : 8;
  const r = block.media[0].ratio;
  if (r < 0.8) return 4; // tall
  if (r < 1.2) return 5; // squarish
  return 7; // wide
}

// Paragraph styles. Phones: small, bold, centred (like the wireframes).
const textMobile =
  "reveal-text mt-10 max-w-[292px] text-center text-[11px] font-bold leading-[1.38] tracking-[-0.005em]";
// Desktop: poster-style text block. All caps, justified edge to edge (last
// line too), tight line spacing, so each paragraph sits like a solid block.
const poster =
  "md:w-full md:text-justify md:[text-align-last:justify] md:font-normal md:uppercase md:leading-[1.08] md:tracking-[0.005em] md:[hyphens:none]";
// Desktop, next to an image: centred in the free space and against the image's height.
const textBeside = `${textMobile} ${poster} md:max-w-[28rem] md:self-center md:justify-self-center md:text-[clamp(14px,1.05vw,18px)]`;
// Desktop, on its own line (after a full-width image): a wider block in the middle.
const textCentered = `${textMobile} ${poster} md:mx-auto md:mt-20 md:max-w-[40rem] md:text-[clamp(16px,1.3vw,22px)]`;

function MediaBlockView({
  block,
  span,
  eager,
  bleed,
  fit,
  parallax,
  className = "",
  style,
}: {
  block: MediaBlock;
  span: number;
  eager?: boolean;
  bleed?: boolean; // desktop: run edge to edge past the page margins
  fit?: boolean; // desktop: as tall as the screen, width follows the image's shape
  parallax?: number; // desktop: drift speed while scrolling
  className?: string;
  style?: CSSProperties;
}) {
  const desktopVw = bleed ? 100 : Math.round((span / 12) * 100);
  const sizes = (m: Media) =>
    `(min-width: 768px) ${Math.round(desktopVw / block.media.length)}vw, ${Math.round((m.mw / 402) * 100)}vw`;
  const bleedClass = bleed
    ? "md:-mx-8 md:w-[calc(100%+4rem)]"
    : fit
      ? "md:h-[calc(100svh-7rem)] md:w-auto md:max-w-full md:justify-self-end"
      : "md:w-full";

  if (block.media.length === 1) {
    const m = block.media[0];
    return (
      <ProjectMedia
        media={m}
        sizes={sizes(m)}
        eager={eager}
        parallax={parallax}
        className={`reveal-img w-(--mw) ${bleedClass} ${className}`}
        style={{ "--mw": pct(m.mw), ...style } as CSSProperties}
      />
    );
  }

  // Two side by side.
  const total = block.media.reduce((sum, m) => sum + m.mw, 0) + (block.gap ?? 0);
  return (
    <div
      data-parallax={parallax}
      className={`reveal-img flex w-(--mw) items-start gap-(--g) ${block.gap === undefined ? "" : "md:gap-6"} ${bleedClass} ${className}`}
      style={{ "--mw": pct(total), "--g": pct(block.gap ?? 0), ...style } as CSSProperties}
    >
      {block.media.map((m) => (
        <ProjectMedia key={m.src} media={m} sizes={sizes(m)} className="min-w-0 flex-1" />
      ))}
    </div>
  );
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  // The project after this one in projects.ts (wraps round to the first).
  const next = PROJECTS[(PROJECTS.findIndex((p) => p.slug === slug) + 1) % PROJECTS.length];

  const { rows, tail } = toRows(project.blocks, project.textBesideNext);
  const [hero, ...rest] = rows;
  const heroIsTall = hero.block.media.length === 1 && hero.block.media[0].ratio < 1.1;

  // Everything is placed on the desktop grid by row/column, so the order in
  // the HTML only matters on phones: there it follows projects.ts exactly.
  const items: { at: number; node: ReactNode }[] = [];
  const add = (at: number, node: ReactNode) => items.push({ at, node });
  let row = 1;

  // --- Title, year and tags -------------------------------------------------
  add(
    -1,
    <header
      key="header"
      className={`${place} flex flex-col items-center px-6 text-center md:px-0 md:text-left ${
        heroIsTall ? "md:items-start" : "md:flex-row md:items-end md:justify-between md:gap-12"
      }`}
      style={at(1, heroIsTall ? 7 : 12, row)}
    >
      <h1 className="reveal-text max-w-[300px] text-[14px] font-bold leading-[1.2] tracking-[-0.015em] md:max-w-[16ch] md:text-[clamp(40px,4.6vw,80px)] md:leading-[0.98] md:tracking-[-0.04em]">
        <Words text={project.title} />
      </h1>
      <div className={`mt-4 md:shrink-0 md:text-[14px] md:leading-[1.5] ${heroIsTall ? "md:mt-10" : "md:mt-0 md:pb-2 md:text-right"}`}>
        <p className="text-[10.5px] uppercase tracking-[-0.01em] md:text-[14px]">{project.kind}</p>
        <ul className="mt-6 max-w-[300px] text-[8.5px] md:mt-3 md:max-w-none md:text-[14px]">
          {project.tags.map((tag, i) => (
            <li key={tag} className="inline md:block">
              {i > 0 && <span className="md:hidden"> • </span>}
              {tag}
            </li>
          ))}
        </ul>
        {/* Link to the live project (link in projects.ts), opens in a new tab. */}
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="visit"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-lime px-4 py-1.5 text-[12px] transition-transform hover:-rotate-2 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black md:mt-5 md:text-[14px]"
          >
            {project.linkLabel ?? "visit the website"}
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </header>
  );

  // --- Opening image ----------------------------------------------------------
  if (heroIsTall) {
    // Portrait opener stands to the right of the title, its paragraph below the title.
    add(
      hero.at,
      <MediaBlockView
        key="hero"
        block={hero.block}
        span={5}
        eager
        fit
        className={`${place} mt-9 md:mt-0`}
        style={at(8, 5, 1, 2)}
      />
    );
    if (hero.text) {
      add(
        hero.textAt!,
        <p key="hero-text" className={`${place} ${textBeside} md:mt-16`} style={at(1, 7, 2)}>
          <Words text={hero.text} />
        </p>
      );
    }
    row = 3;
  } else {
    // Landscape opener runs edge to edge, shown in full (never cropped).
    row = 2;
    add(
      hero.at,
      <MediaBlockView
        key="hero"
        block={hero.block}
        span={12}
        bleed
        eager
        className={`${place} mt-9 md:mt-16`}
        style={at(1, 12, row)}
      />
    );
    row += 1;
    if (hero.text) {
      add(
        hero.textAt!,
        <p key="hero-text" className={`${place} ${textCentered}`} style={at(1, 12, row)}>
          <Words text={hero.text} />
        </p>
      );
      row += 1;
    }
  }

  // --- The rest: alternating left / right ----------------------------------------
  rest.forEach((r, i) => {
    const span = desktopSpan(r.block);
    const left = i % 2 === 0;
    const key = `row-${i}`;

    if (span === 12) {
      // Two images that touch: full width, paragraph centred underneath.
      add(
        r.at,
        <MediaBlockView
          key={key}
          block={r.block}
          span={12}
          bleed
          className={`${place} mt-10 md:mt-28`}
          style={at(1, 12, row)}
        />
      );
      row += 1;
      if (r.text) {
        add(
          r.textAt!,
          <p key={`${key}-text`} className={`${place} ${textCentered}`} style={at(1, 12, row)}>
            <Words text={r.text} />
          </p>
        );
        row += 1;
      }
      return;
    }

    // No paragraph next to it: the image sits in the middle of the page.
    if (!r.text) {
      const even = span % 2 === 0 ? span : span + 1;
      add(
        r.at,
        <MediaBlockView
          key={key}
          block={r.block}
          span={even}
          parallax={0.08}
          className={`${place} mt-10 md:mt-28`}
          style={at((12 - even) / 2 + 1, even, row)}
        />
      );
      row += 1;
      return;
    }

    // The paragraph gets all the columns the image doesn't use (minus a gap column).
    const mediaCol = left ? 1 : 13 - span;
    const textSpan = 12 - span - 1;
    const textCol = left ? span + 2 : 1;

    add(
      r.at,
      <MediaBlockView
        key={key}
        block={r.block}
        span={span}
        parallax={left ? 0.06 : 0.11}
        className={`${place} mt-10 md:mt-28`}
        style={at(mediaCol, span, row)}
      />
    );
    if (r.text) {
      add(
        r.textAt!,
        <p key={`${key}-text`} className={`${place} ${textBeside} md:mt-28`} style={at(textCol, textSpan, row)}>
          <Words text={r.text} />
        </p>
      );
    }
    row += 1;
  });

  // --- A last paragraph with no image of its own: centred underneath ------------
  if (tail) {
    add(
      tail.at,
      <p key="tail-text" className={`${place} ${textCentered} md:mt-28`} style={at(1, 12, row)}>
        <Words text={tail.text} />
      </p>
    );
    row += 1;
  }

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#f7f7f7] text-black">
      {/* Page background (also shows when you over-scroll). */}
      <style>{"body{background:#f7f7f7}"}</style>

      <nav
        aria-label="Main"
        className="absolute right-6 top-[calc(env(safe-area-inset-top,0px)+16px)] z-10 flex gap-[18px] text-sm tracking-[-0.01em]"
      >
        <Link href="/projects" className="underline-offset-[3px] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">
          projects
        </Link>
        <Link href="/about" className="underline-offset-[3px] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">
          this is me
        </Link>
      </nav>

      <main className="flex flex-col items-center pt-[70px] md:grid md:grid-cols-12 md:items-start md:gap-x-6 md:px-8 md:pt-20">
        {items.sort((a, b) => a.at - b.at).map((item) => item.node)}
      </main>

      {/* Next project (after the last one it goes back to the first). */}
      <Link
        href={`/projects/${next.slug}`}
        data-cursor="next"
        className="group mx-6 mt-16 flex items-end justify-between gap-6 border-y border-black py-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black md:mx-8 md:mt-48 md:py-10"
      >
        <span className="min-w-0">
          <span className="block text-[11px] uppercase tracking-[-0.01em] md:text-[14px]">next project</span>
          <span className="mt-2 block text-[22px] font-bold leading-[1.05] tracking-[-0.03em] transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:translate-x-3 md:mt-3 md:text-[clamp(40px,5vw,88px)] md:leading-[0.98] md:tracking-[-0.04em]">
            {next.title}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-black bg-lime text-[22px] transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:-rotate-45 md:size-20 md:text-[34px]"
        >
          →
        </span>
      </Link>

      <ProjectFooter className="mt-16 md:mt-24" />
      <ScrollReveal progress />
    </div>
  );
}