import Link from "next/link";
import type { CSSProperties } from "react";

// Blue footer for the project pages.
// Phones: one column, like the wireframe (label, content, label, content...).
// Desktop: the three sections sit side by side under one shared label bar.

const FIELDS =
  "UI/UX Designer, Frontend Developer, Graphic Designer, Creative Direction, Prototyping, Custom Product Design, Marketing Graphics Design, Immersive Experience Design, Visual & Brand Identity Creation.";
const EMAIL = "coralierasmus@gmail.com";

// Desktop grid spot: column start / width, row.
const at = (col: number, span: number, row: number) =>
  ({ "--c": col, "--s": span, "--r": row }) as CSSProperties;
const place = "md:[grid-column:var(--c)/span_var(--s)] md:[grid-row:var(--r)]";

const label = `${place} border-y border-black px-3.5 py-1 text-[9px] md:px-8 md:py-2 md:text-[13px] -mt-px`;

export default function ProjectFooter({ credits }: { credits?: string }) {
  return (
    <footer className="mt-16 bg-sky pb-[env(safe-area-inset-bottom,0px)] text-black md:mt-48">
      <div className="px-3.5 pb-4 pt-5 md:px-8 md:pb-6 md:pt-8">
        <Link
          href="/"
          aria-label="Back to the home page"
          className="inline-block w-[54px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black md:w-[76px]"
        >
          <svg viewBox="0 0 54 14" aria-hidden="true" className="block h-auto w-full">
            <path d="M53 7H2M8 1L2 7l6 6" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </Link>
      </div>

      <div className="md:grid md:grid-cols-12">
        <h2 className={label} style={at(1, 6, 1)}>
          fields of work
        </h2>
        <p
          className={`${place} px-3.5 py-8 text-[20px] leading-[1.22] tracking-[-0.01em] md:px-8 md:pb-24 md:pt-10 md:text-[clamp(24px,2.3vw,36px)] md:leading-[1.15]`}
          style={at(1, 6, 2)}
        >
          {FIELDS}
        </p>

        <h2 className={`${label} md:border-l`} style={at(7, 3, 1)}>
          contact me
        </h2>
        <div className={`${place} px-3.5 py-8 md:border-l md:border-black md:px-8 md:pt-10`} style={at(7, 3, 2)}>
          <a
            href={`mailto:${EMAIL}`}
            className="text-[22px] tracking-[-0.01em] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black md:text-[clamp(16px,1.35vw,22px)]"
          >
            {EMAIL}
          </a>
        </div>

        <h2 className={`${label} md:border-l`} style={at(10, 3, 1)}>
          credits
        </h2>
        <p
          className={`${place} whitespace-pre-line px-3.5 pb-8 pt-4 text-[8px] leading-[1.35] md:border-l md:border-black md:px-8 md:pt-10 md:text-[12px]`}
          style={at(10, 3, 2)}
        >
          {credits}
        </p>
      </div>
    </footer>
  );
}
