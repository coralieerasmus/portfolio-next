import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import ProjectFooter from "@/components/projects/ProjectFooter";
import ProjectMedia from "@/components/projects/ProjectMedia";
import { getProject, PROJECTS, type Block, type Media } from "@/content/projects";

// One page per project in content/projects.ts, at /projects/<slug>.
//
// PHONES follow the wireframes: everything centred in one column, each
// image at its wireframe width.
// DESKTOP uses a 12-column grid built from the same content:
//   - a big left-aligned title with the year and tags beside it
//   - the first image as the opener: edge to edge if it's landscape, or
//     standing next to the title if it's portrait
//   - after that, each image alternates left / right with its paragraph
//     sitting next to it on the other side, lined up with the image's bottom

type MediaBlock = Extract<Block, { media: Media[] }>;
type Row = { block: MediaBlock; text?: string };

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

// Each image block plus the paragraph that follows it.
function toRows(blocks: Block[]): Row[] {
  const rows: Row[] = [];
  for (const b of blocks) {
    if ("media" in b) rows.push({ block: b });
    else if (rows.length) rows[rows.length - 1].text = b.text;
  }
  return rows;
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
  "mt-10 max-w-[292px] text-center text-[11px] font-bold leading-[1.38] tracking-[-0.005em] md:text-left";
const desktopBody = "md:max-w-[34ch] md:text-[clamp(15px,1.2vw,19px)] md:leading-[1.35]";
// Beside an image, lined up with its bottom edge.
const textBeside = `${textMobile} ${desktopBody} md:mt-0 md:self-end`;
// Under a full-width image.
const textBelow = `${textMobile} ${desktopBody} md:mt-10 md:self-start`;
// After the opening image: a bigger opening statement.
const textLede = `${textMobile} md:mt-20 md:max-w-[30ch] md:self-start md:text-[clamp(22px,2.2vw,34px)] md:leading-[1.15] md:tracking-[-0.02em]`;

function MediaBlockView({
  block,
  span,
  eager,
  bleed,
  className = "",
  style,
}: {
  block: MediaBlock;
  span: number;
  eager?: boolean;
  bleed?: boolean; // desktop: run edge to edge past the page margins
  className?: string;
  style?: CSSProperties;
}) {
  const desktopVw = bleed ? 100 : Math.round((span / 12) * 100);
  const sizes = (m: Media) =>
    `(min-width: 768px) ${Math.round(desktopVw / block.media.length)}vw, ${Math.round((m.mw / 402) * 100)}vw`;
  const bleedClass = bleed ? "md:-mx-8 md:w-[calc(100%+4rem)]" : "md:w-full";

  if (block.media.length === 1) {
    const m = block.media[0];
    return (
      <ProjectMedia
        media={m}
        sizes={sizes(m)}
        eager={eager}
        className={`w-(--mw) ${bleedClass} ${className}`}
        style={{ "--mw": pct(m.mw), ...style } as CSSProperties}
      />
    );
  }

  // Two side by side.
  const total = block.media.reduce((sum, m) => sum + m.mw, 0) + (block.gap ?? 0);
  return (
    <div
      className={`flex w-(--mw) items-start gap-(--g) ${block.gap === undefined ? "" : "md:gap-6"} ${bleedClass} ${className}`}
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

  const [hero, ...rest] = toRows(project.blocks);
  const heroIsTall = hero.block.media.length === 1 && hero.block.media[0].ratio < 1.1;

  const items: ReactNode[] = [];
  let row = 1;

  // --- Title, year and tags -------------------------------------------------
  items.push(
    <header
      key="header"
      className={`${place} flex flex-col items-center px-6 text-center md:px-0 md:text-left ${
        heroIsTall ? "md:items-start" : "md:flex-row md:items-end md:justify-between md:gap-12"
      }`}
      style={at(1, heroIsTall ? 7 : 12, row)}
    >
      <h1 className="max-w-[300px] text-[14px] font-bold leading-[1.2] tracking-[-0.015em] md:max-w-[16ch] md:text-[clamp(40px,4.6vw,80px)] md:leading-[0.98] md:tracking-[-0.04em]">
        {project.title}
      </h1>
      <div className={`mt-4 md:shrink-0 md:text-[13px] md:leading-[1.5] ${heroIsTall ? "md:mt-10" : "md:mt-0 md:pb-2 md:text-right"}`}>
        <p className="text-[10.5px] uppercase tracking-[-0.01em] md:text-[13px]">{project.kind}</p>
        <ul className="mt-6 max-w-[300px] text-[8.5px] md:mt-3 md:max-w-none md:text-[13px]">
          {project.tags.map((tag, i) => (
            <li key={tag} className="inline md:block">
              {i > 0 && <span className="md:hidden"> • </span>}
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );

  // --- Opening image ----------------------------------------------------------
  if (heroIsTall) {
    // Portrait opener stands to the right of the title, its paragraph below the title.
    items.push(
      <MediaBlockView
        key="hero"
        block={hero.block}
        span={4}
        eager
        className={`${place} mt-9 md:mt-0`}
        style={at(9, 4, 1, 2)}
      />
    );
    if (hero.text) {
      items.push(
        <p key="hero-text" className={`${place} ${textBeside}`} style={at(1, 6, 2)}>
          {hero.text}
        </p>
      );
    }
    row = 3;
  } else {
    // Landscape opener runs edge to edge, capped so it fits the screen.
    row = 2;
    items.push(
      <MediaBlockView
        key="hero"
        block={hero.block}
        span={12}
        bleed
        eager
        className={`${place} mt-9 md:mt-16 md:max-h-[88vh]`}
        style={at(1, 12, row)}
      />
    );
    row += 1;
    if (hero.text) {
      // Its paragraph becomes a bigger opening statement.
      items.push(
        <p
          key="hero-text"
          className={`${place} ${textLede}`}
          style={at(2, 8, row)}
        >
          {hero.text}
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
      // Two images that touch: full width, paragraph on the next line.
      items.push(
        <MediaBlockView
          key={key}
          block={r.block}
          span={12}
          bleed
          className={`${place} mt-10 md:mt-40`}
          style={at(1, 12, row)}
        />
      );
      row += 1;
      if (r.text) {
        items.push(
          <p key={`${key}-text`} className={`${place} ${textBelow}`} style={at(left ? 8 : 2, 4, row)}>
            {r.text}
          </p>
        );
        row += 1;
      }
      return;
    }

    const textSpan = Math.min(4, 11 - span);
    const mediaCol = left ? 1 : 13 - span;
    const textCol = left ? span + 2 : 13 - span - 1 - textSpan;

    items.push(
      <MediaBlockView
        key={key}
        block={r.block}
        span={span}
        className={`${place} mt-10 md:mt-40`}
        style={at(mediaCol, span, row)}
      />
    );
    if (r.text) {
      items.push(
        <p key={`${key}-text`} className={`${place} ${textBeside}`} style={at(textCol, textSpan, row)}>
          {r.text}
        </p>
      );
    }
    row += 1;
  });

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

      <main className="flex flex-col items-center pt-[70px] md:grid md:grid-cols-12 md:items-start md:gap-x-6 md:px-8 md:pt-32">
        {items}
      </main>

      <ProjectFooter credits={project.credits} />
    </div>
  );
}
