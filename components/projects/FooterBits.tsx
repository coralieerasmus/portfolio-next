"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// The moving parts of the footer:
// - FooterReveal: the footer stays still behind the page, and the page slides
//   up off it as you scroll to the bottom (desktop only, when it fits on screen)
// - LocalTimes:   live clocks for Eindhoven and Aruba, with a sun or a moon
// - CopyEmail:    the email address; clicking copies it and a "copied!" sticker pops up
// - BackToTop:    a gumball that rolls you back to the top of the page

// ---------------------------------------------------------------------------
// Footer reveal

export function FooterReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const mq = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    const update = () => {
      const h = el.offsetHeight;
      setHeight(h);
      // Only when the whole footer fits on the screen, otherwise you couldn't read the top of it.
      setReveal(mq.matches && h <= window.innerHeight - 40);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    mq.addEventListener("change", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
    };
  }, []);

  return (
    // The <footer> is a "window" the size of the footer; the footer itself is
    // pinned to the bottom of the screen behind it, so scrolling uncovers it.
    <footer className={`relative ${className}`} style={reveal ? { height, clipPath: "inset(0)" } : undefined}>
      {reveal && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-8 bg-gradient-to-b from-black/20 to-transparent"
        />
      )}
      <div ref={inner} className={reveal ? "fixed inset-x-0 bottom-0" : ""}>
        {children}
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Local times

const PLACES = [
  { city: "Eindhoven", zone: "Europe/Amsterdam" },
  { city: "Aruba", zone: "America/Aruba" },
];

function timeIn(zone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "--";
  return { h: get("hour"), m: get("minute") };
}

const CLOCK_CSS = `
@keyframes clock-blink { 50% { opacity: 0; } }
.clock-colon { animation: clock-blink 1s steps(1) infinite; }
@keyframes sun-spin { to { rotate: 360deg; } }
.sun-rays { transform-origin: 12px 12px; transform-box: view-box; animation: sun-spin 24s linear infinite; }
@keyframes moon-rock { 0%, 100% { rotate: -8deg; } 50% { rotate: 8deg; } }
.moon-rock { transform-origin: 12px 12px; transform-box: view-box; animation: moon-rock 6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .clock-colon, .sun-rays, .moon-rock { animation: none; } }
`;

// Thin line-drawn sun (rays slowly turning) and moon (gently rocking),
// drawn in the text colour so they match the thin footer type.
function SkyIcon({ day }: { day: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={day ? "daytime" : "night-time"}
      className="size-[0.8em] shrink-0 self-center"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    >
      {day ? (
        <>
          <circle cx="12" cy="12" r="4.5" />
          <g className="sun-rays">
            {Array.from({ length: 8 }, (_, i) => (
              <line key={i} x1="12" y1="1.5" x2="12" y2="4.5" transform={`rotate(${i * 45} 12 12)`} />
            ))}
          </g>
        </>
      ) : (
        <g className="moon-rock">
          <path d="M15.5 3.5a8.5 8.5 0 1 0 5 13.5A7 7 0 0 1 15.5 3.5Z" strokeLinejoin="round" />
          <path d="M19 4.5v2M18 5.5h2" />
        </g>
      )}
    </svg>
  );
}

export function LocalTimes() {
  const [now, setNow] = useState<Date | null>(null); // only known in the browser

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid md:grid-cols-2">
      <style>{CLOCK_CSS}</style>
      {PLACES.map((p) => {
        const t = now ? timeIn(p.zone, now) : { h: "--", m: "--" };
        const hour = Number(t.h);
        const day = now ? hour >= 7 && hour < 19 : true;
        return (
          <div key={p.city} className="px-3.5 py-2 md:px-8 md:py-3">
            <p className="flex items-baseline gap-[0.25em] whitespace-nowrap text-[clamp(30px,4vw,68px)] leading-[0.98] tracking-[-0.035em]">
              <span>{p.city}</span>
              <time suppressHydrationWarning className="tabular-nums">
                {t.h}
                <span className="clock-colon">:</span>
                {t.m}
              </time>
              <SkyIcon day={day} />
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copy email

export function CopyEmail({ email, className = "" }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(0); // changes on every copy, so the sticker pops again
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied((c) => c + 1);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(0), 1600);
    } catch {
      window.location.href = `mailto:${email}`; // copying not allowed: just open the mail app
    }
  };

  return (
    <button type="button" onClick={copy} data-cursor="copy" className={`relative cursor-pointer ${className}`}>
      {email}
      {copied > 0 && (
        <span
          key={copied}
          role="status"
          className="absolute -top-4 right-[-10px] rotate-[8deg] animate-pop rounded-full border-2 border-black bg-sunny px-2.5 py-0.5 text-[12px] md:text-[13px]"
        >
          copied!
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Back to top gumball

const ROLL_MS = 900;
const ROLL_CSS = `
@keyframes gumball-roll {
  0% { transform: translateY(0) rotate(0deg); }
  35% { transform: translateY(-40%) rotate(-260deg); }
  60% { transform: translateY(0) rotate(-500deg); }
  80% { transform: translateY(-12%) rotate(-640deg); }
  100% { transform: translateY(0) rotate(-720deg); }
}
.gumball-roll { animation: gumball-roll ${ROLL_MS}ms cubic-bezier(0.3, 0, 0.3, 1); }
@media (prefers-reduced-motion: reduce) { .gumball-roll { animation: none; } }
`;

export function BackToTop() {
  const [rolling, setRolling] = useState(false);

  const go = () => {
    if (rolling) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setRolling(true);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    setTimeout(() => setRolling(false), reduce ? 0 : ROLL_MS);
  };

  return (
    <button
      type="button"
      onClick={go}
      data-cursor="top"
      aria-label="Back to the top of the page"
      className="group flex cursor-pointer items-center gap-3 text-[11px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black md:text-[14px]"
    >
      <style>{ROLL_CSS}</style>
      <span aria-hidden="true">back to top</span>
      <span
        aria-hidden="true"
        className={`relative block size-9 rounded-full border-2 border-black bg-pink transition-transform duration-300 group-hover:-translate-y-1 md:size-12 ${
          rolling ? "gumball-roll" : ""
        }`}
      >
        {/* shine */}
        <span className="absolute left-[22%] top-[18%] h-[28%] w-[20%] -rotate-[30deg] rounded-full bg-white/80" />
        {/* a little spot so you can see it roll */}
        <span className="absolute bottom-[20%] right-[22%] size-[18%] rounded-full bg-lime" />
      </span>
    </button>
  );
}