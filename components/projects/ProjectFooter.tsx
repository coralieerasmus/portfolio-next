import fs from "node:fs";
import path from "node:path";
import { Inter_Tight } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import Ticker from "./Ticker";
import { BackToTop, CopyEmail, FooterReveal, LocalTimes } from "./FooterBits";
import { PROJECTS } from "@/content/projects";

// The blue footer used on every page (about + all project pages), styled
// like an index page: small labels between thin lines, and big grotesk text.
// Top to bottom: back arrow + back-to-top gumball, contact, fields of work
// (a huge draggable line with little project pictures in between), local
// time, and credits + disclaimer side by side.
// On desktop the footer sits still behind the page and gets uncovered as
// you scroll down (see FooterReveal in FooterBits.tsx).

const FIELDS = [
  "UI/UX Design",
  "Frontend Development",
  "Graphic Design",
  "Creative Direction",
  "Prototyping",
  "Custom Product Design",
  "Marketing Graphics",
  "Immersive Experience Design",
  "Visual and Brand Identity",
];
// How many little project pictures follow each field (same order as FIELDS).
const THUMBS_AFTER = [3, 0, 2, 1, 0, 2, 3, 1, 2];
const TICKER_SECONDS = 70; // time for one full loop at normal speed (higher = slower)

const EMAIL = "coralierasmus@gmail.com";
const LINKEDIN = "https://www.linkedin.com/in/coralieerasmus/";

// Credits, shown on every page. Each group gets an arrow heading, then one
// line per item: name (by). Add a new group or item here when something
// needs crediting, e.g. { title: "Stickers", items: [{ name: "Gecko", by: "Artist" }] }.
export type CreditGroup = { title: string; items: { name: string; by?: string }[] };
const DEFAULT_CREDITS: CreditGroup[] = [
  {
    title: "Typefaces in use",
    items: [
      { name: "NerSans", by: "Garisman Studio" },
      { name: "Alte Haas Grotesk", by: "Yann Le Coroller" },
      { name: "Inter Tight", by: "Rasmus Andersson" },
    ],
  },
];
const DISCLAIMER =
  "All texts and images are the exclusive copyright of Coralie Erasmus, unless credited otherwise. Content on this website may not be reproduced or redistributed without permission.";

// One picture per project (the first one that exists in /public), for the
// little thumbnails between the fields of work.
const THUMBS = PROJECTS.flatMap((p) => {
  for (const b of p.blocks) {
    if (!("media" in b)) continue;
    for (const m of b.media) {
      if (m.type !== "video" && fs.existsSync(path.join(process.cwd(), "public", m.src))) return [m.src];
    }
  }
  return [];
});

// Thin font for the big text (Alte Haas only comes in regular and bold,
// which felt too heavy at this size). Next.js downloads it automatically.
const light = Inter_Tight({ subsets: ["latin"], weight: ["300"], display: "swap" });

// Styles
const line = "border-t border-black";
const label = `${line} px-3.5 py-1.5 text-[11px] font-normal md:px-8 md:py-2 md:text-[13px]`;
const colLabel = "px-3.5 py-1.5 text-[11px] font-normal md:px-8 md:py-2 md:text-[13px]";
const big = `${light.className} leading-[0.98] tracking-[-0.035em]`;
const hover =
  "transition-colors duration-300 hover:text-pink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black";
const small = "font-serif text-[10px] leading-[1.25] md:text-[14px]"; // the little print, like the inspo

type Props = {
  credits?: CreditGroup[];
  className?: string; // extra classes, e.g. space above the footer
};

export default function ProjectFooter({ credits = DEFAULT_CREDITS, className = "mt-16 md:mt-48" }: Props) {
  let thumb = 0; // runs through THUMBS so every field gets different pictures

  return (
    <FooterReveal className={className}>
      <div className="bg-sky pb-[env(safe-area-inset-bottom,0px)] text-black">
        {/* Back home (left) and back to top (right) */}
        <div className="flex items-center justify-between px-3.5 py-3 md:px-8 md:py-4">
          <Link
            href="/"
            aria-label="Back to the home page"
            className="group inline-block w-[54px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black md:w-[72px]"
          >
            <svg
              viewBox="0 0 54 14"
              aria-hidden="true"
              className="block h-auto w-full transition-transform duration-300 ease-out group-hover:-translate-x-2 motion-reduce:transition-none"
            >
              <path d="M53 7H2M8 1L2 7l6 6" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </Link>
          <BackToTop />
        </div>

        {/* Contact: the email huge (click = copy), LinkedIn and "let's talk" underneath */}
        <h2 className={label}>Contact</h2>
        <div className={`${line} px-3.5 pb-3 pt-2 md:px-8 md:pb-5 md:pt-3`}>
          <CopyEmail
            email={EMAIL}
            className={`${big} ${hover} block whitespace-nowrap text-left text-[clamp(24px,6.4vw,112px)]`}
          />
          <div className={`${big} grid grid-cols-2 text-[clamp(24px,6.4vw,112px)]`}>
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className={`${hover} justify-self-start`}>
              LinkedIn
            </a>
            <a href={`mailto:${EMAIL}`} data-cursor="say hi" className={`${hover} justify-self-start`}>
              <span className="opacity-50">(</span>Let&apos;s talk<span className="opacity-50">)</span>
            </a>
          </div>
        </div>

        {/* Fields of work: one huge line with little pictures, keeps sliding, draggable */}
        <h2 className={label}>Fields of work</h2>
        <Ticker seconds={TICKER_SECONDS} draggable className={`${line} py-2 md:py-4`}>
          <p className={`${big} flex items-center whitespace-nowrap pr-[0.35em] text-[clamp(40px,6.4vw,112px)]`}>
            {FIELDS.map((f, i) => {
              const count = THUMBS.length ? THUMBS_AFTER[i % THUMBS_AFTER.length] : 0;
              const pics = Array.from({ length: count }, () => THUMBS[thumb++ % THUMBS.length]);
              return (
                <span key={f} className="flex items-center">
                  {f}
                  {i < FIELDS.length - 1 ? "," : "."}
                  {pics.length > 0 && (
                    <span className="ml-[0.25em] flex gap-[0.08em]" aria-hidden="true">
                      {pics.map((src, j) => (
                        <Image
                          key={`${src}-${j}`}
                          src={src}
                          alt=""
                          width={96}
                          height={96}
                          draggable={false}
                          className="size-[0.62em] object-cover"
                        />
                      ))}
                    </span>
                  )}
                  <span className="w-[0.3em]" />
                </span>
              );
            })}
          </p>
        </Ticker>

        {/* Live local time */}
        <h2 className={label}>Local time</h2>
        <div className={`${line} ${light.className} tracking-[-0.035em]`}>
          <LocalTimes />
        </div>

        {/* Credits + disclaimer, side by side */}
        <div className={`grid grid-cols-2 ${line}`}>
          <h2 className={colLabel}>Credits</h2>
          <h2 className={colLabel}>Disclaimer</h2>
        </div>
        <div className={`grid grid-cols-2 ${line} pb-10 pt-3 md:pb-14 md:pt-4 ${small}`}>
          <div className="flex flex-col gap-3 px-3.5 md:px-8">
            {credits.map((group) => (
              <div key={group.title}>
                <p>
                  <span aria-hidden="true">→ </span>
                  {group.title}
                </p>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.name}>
                      {item.name}
                      {item.by && <span> ({item.by})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="max-w-[46ch] px-3.5 md:px-8">{DISCLAIMER}</p>
        </div>
      </div>
    </FooterReveal>
  );
}