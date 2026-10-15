"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Gumball machine: every gumball is a project. Turn the knob, the globe
// shakes, one random gumball drops into the tray and opens up into that
// project. Dispensed gumballs are gone from the globe; when it's empty the
// knob refills it.

export type Gumball = {
  slug: string;
  title: string;
  kind: string;
  src: string;
  alt: string;
};

// Where the gumballs sit inside the globe (centre x / y in % of the globe),
// filled from the bottom up.
const SLOTS: [number, number][] = [
  [21, 79], [40, 82], [60, 82], [79, 79],
  [13, 62], [31, 64], [50, 65], [69, 64], [87, 62],
  [22, 46], [41, 48], [60, 47], [78, 45],
  [32, 30], [52, 31], [70, 30],
];
const RIMS = ["#ff56b6", "#d1fb53", "#82d1f5", "#fff63e"]; // site colours, one per gumball in turn

const SHAKE_MS = 900; // globe shaking after turning the knob
const DROP_MS = 950; // gumball falling into the tray

type Phase = "idle" | "shaking" | "dropping" | "revealed";

const CSS = `
@keyframes gumball-shake {
  0%, 100% { translate: -50% -50%; }
  20% { translate: calc(-50% - 6%) calc(-50% - 10%); }
  40% { translate: calc(-50% + 7%) calc(-50% - 4%); }
  60% { translate: calc(-50% - 4%) calc(-50% - 12%); }
  80% { translate: calc(-50% + 5%) calc(-50% - 3%); }
}
.gumball-shake { animation: gumball-shake 0.3s ease-in-out 3; }

@keyframes gumball-drop {
  0% { transform: translateY(-260%) scale(0.7); opacity: 0; }
  15% { opacity: 1; }
  60% { transform: translateY(0) scale(1); }
  75% { transform: translateY(-22%) scale(1); }
  88% { transform: translateY(0) scale(1); }
  94% { transform: translateY(-6%) scale(1); }
  100% { transform: translateY(0) scale(1); }
}
.gumball-drop { animation: gumball-drop ${DROP_MS}ms cubic-bezier(0.3, 0, 0.4, 1) both; }

@media (prefers-reduced-motion: reduce) {
  .gumball-shake, .gumball-drop { animation: none; }
}
`;

// A gumball: the project picture in a circle with a coloured rim and a shine.
function Ball({ ball, rim, sizes }: { ball: Gumball; rim: string; sizes: string }) {
  return (
    <span
      className="relative block size-full overflow-hidden rounded-full border-2 border-black"
      style={{ boxShadow: `inset 0 0 0 3px ${rim}` }}
    >
      <Image src={ball.src} alt="" fill sizes={sizes} className="object-cover" />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.75),rgba(255,255,255,0)_38%)]"
      />
    </span>
  );
}

export default function GumballMachine({ balls }: { balls: Gumball[] }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [taken, setTaken] = useState<string[]>([]); // slugs already dispensed
  const [picked, setPicked] = useState<number | null>(null);
  const [turns, setTurns] = useState(0);
  const result = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const inGlobe = balls.map((b, i) => ({ b, i })).filter(({ b }) => !taken.includes(b.slug));
  const empty = inGlobe.length === 0;
  const busy = phase === "shaking" || phase === "dropping";

  const turn = () => {
    if (busy) return;
    if (empty) {
      setTaken([]);
      setPicked(null);
      setPhase("idle");
      setTurns((t) => t + 1);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const choice = inGlobe[Math.floor(Math.random() * inGlobe.length)].i;
    setTurns((t) => t + 1);
    setPicked(choice);
    setPhase("shaking");
    timers.current.push(
      setTimeout(
        () => {
          setTaken((t) => [...t, balls[choice].slug]);
          setPhase("dropping");
          timers.current.push(
            setTimeout(
              () => {
                setPhase("revealed");
                // On phones the result is under the machine: bring it into view.
                if (window.innerWidth < 768) result.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              },
              reduce ? 0 : DROP_MS
            )
          );
        },
        reduce ? 0 : SHAKE_MS
      )
    );
  };

  const current = picked !== null ? balls[picked] : null;

  return (
    <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
      <style>{CSS}</style>

      {/* ---------- The machine ---------- */}
      {/* Width follows the screen height too, so the whole machine fits in
          view as soon as you land on the page. */}
      <div className="mx-auto" style={{ width: "max(220px, min(78vw, 400px, calc((100dvh - 140px) / 1.7)))" }}>
        {/* Lid: its bottom tucks in behind the globe, so they connect. */}
        <div
          className="mx-auto -mb-[4%] w-[34%] rounded-t-[999px] border-2 border-b-0 border-black bg-pink"
          style={{ aspectRatio: "34 / 11" }}
        />

        {/* Glass globe with the gumballs. Solid background so the lid and
            neck tucked behind it don't show through. */}
        <div className="relative z-[1] aspect-square rounded-full border-2 border-black bg-[#fbfbfb] bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,1),rgba(255,255,255,0.35)_45%,rgba(130,209,245,0.18))]">
          {inGlobe.map(({ b, i }, n) => {
            const [x, y] = SLOTS[n % SLOTS.length];
            return (
              <span
                key={b.slug}
                className={`absolute w-[20%] ${phase === "shaking" ? "gumball-shake" : ""}`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  translate: "-50% -50%",
                  aspectRatio: "1",
                  rotate: `${(i * 47) % 360}deg`,
                  animationDelay: `${(n % 5) * 40}ms`,
                }}
              >
                <Ball ball={b} rim={RIMS[i % RIMS.length]} sizes="90px" />
              </span>
            );
          })}
          {/* Glass shine on top of the gumballs */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-[16%] top-[12%] h-[26%] w-[12%] -rotate-[28deg] rounded-full bg-white/70"
          />
        </div>

        {/* Neck: its top tucks in behind the globe, its bottom sits on the body. */}
        <div
          className="mx-auto -mt-[6%] w-[44%] border-2 border-b-0 border-black bg-pink"
          style={{ aspectRatio: "44 / 12" }}
        />

        {/* Body with the knob, the chute and the tray */}
        <div className="relative mx-auto w-[86%] rounded-t-[18px] rounded-b-[6px] border-2 border-black bg-pink px-[8%] pb-[10%] pt-[8%]">
          <p className="mb-[6%] text-center text-[12px] tracking-[-0.01em] md:text-[13px]">1 project per turn</p>

          <div className="flex items-end justify-between gap-4">
            {/* Knob */}
            <button
              type="button"
              onClick={turn}
              disabled={busy}
              aria-label={empty ? "Refill the gumball machine" : "Turn the knob to get a random project"}
              data-cursor={empty ? "refill" : "turn"}
              className="group relative grid aspect-square w-[42%] shrink-0 cursor-pointer place-items-center rounded-full border-2 border-black bg-[#f7f7f7] transition-transform hover:scale-105 active:scale-95 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
            >
              <span
                aria-hidden="true"
                className="absolute h-[18%] w-[78%] rounded-full border-2 border-black bg-sunny transition-transform duration-[900ms] ease-[cubic-bezier(0.5,0,0.3,1)] motion-reduce:transition-none"
                style={{ transform: `rotate(${turns * 360}deg)` }}
              />
              <span aria-hidden="true" className="relative size-[18%] rounded-full border-2 border-black bg-white" />
              <span className="absolute left-1/2 top-[calc(100%+4px)] -translate-x-1/2 whitespace-nowrap text-[12px] leading-none md:text-[13px]">
                {empty ? "refill" : "turn me"}
              </span>
            </button>

            {/* Chute + tray */}
            <div className="relative aspect-square w-[40%]">
              <div className="absolute inset-0 rounded-[14px] border-2 border-black bg-black/85" />
              {phase !== "idle" && phase !== "shaking" && current && (
                <span
                  key={turns}
                  className={`absolute left-[16%] top-[16%] w-[68%] ${phase === "dropping" ? "gumball-drop" : ""}`}
                  style={{ aspectRatio: "1" }}
                >
                  <Ball ball={current} rim={RIMS[picked! % RIMS.length]} sizes="140px" />
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Feet */}
        <div className="mx-auto flex w-[70%] justify-between">
          <span className="h-3 w-[18%] rounded-b-md border-2 border-t-0 border-black bg-pink" />
          <span className="h-3 w-[18%] rounded-b-md border-2 border-t-0 border-black bg-pink" />
        </div>
      </div>

      {/* ---------- The result ---------- */}
      <div ref={result} aria-live="polite" className="flex min-h-[320px] flex-col items-center justify-center text-center">
        {phase === "revealed" && current ? (
          <div key={turns} className="flex animate-pop flex-col items-center">
            <div className="relative aspect-square w-[min(56vw,260px)] overflow-hidden rounded-full border-2 border-black">
              <Image src={current.src} alt={current.alt} fill sizes="260px" className="object-cover" />
            </div>
            <p className="mt-6 text-[11px] uppercase tracking-[0.02em] md:text-[13px]">{current.kind}</p>
            <h2 className="mt-2 max-w-[22ch] text-[20px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[clamp(22px,2vw,32px)]">
              {current.title}
            </h2>
            <div className="mt-7 flex items-center gap-5 text-[14px]">
              <Link
                href={`/projects/${current.slug}`}
                className="rounded-full border-2 border-black bg-lime px-5 py-2 transition-transform hover:-rotate-2 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
              >
                Open project
              </Link>
              <button
                type="button"
                onClick={turn}
                className="cursor-pointer underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
              >
                {empty ? "Refill" : "Spin again"}
              </button>
            </div>
          </div>
        ) : (
          <p className="max-w-[24ch] text-[clamp(22px,2.4vw,40px)] font-bold leading-[1.05] tracking-[-0.03em]">
            {busy ? "Here it comes…" : "Turn the knob for a random project."}
          </p>
        )}
      </div>
    </div>
  );
}