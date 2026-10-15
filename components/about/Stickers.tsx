"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import Image from "next/image";
import HelloPopup from "./HelloPopup";
import { gameState } from "./gameState";

// The stickers that slowly pop up the longer you stay on the page, in the
// order they appear. left/top/width are in "design pixels" of the 402px-wide
// PHONE design (left/top = top-left corner of the sticker).
// They're applied as inline styles because they come from this list; the
// page sets 1 design pixel = var(--spacing).
//
// On desktop (md and up) they're placed in the same spots relative to the text
// and photo, worked out from the phone positions (see toDesktop below). To
// fine-tune one on desktop, give it its own dLeft / dTop / dWidth in desktop
// design pixels (390-wide wireframe).
//
// z: which stickers sit on top of which (higher = in front).
//
// The two star stickers are split into separate stars ("parts") that pop up
// one after another. Stars that touch each other stay together as one part.
// Each part's x / y / pw are fractions of the whole sticker (0 to 1).

type Part = { src: string; w: number; h: number; x: number; y: number; pw: number };

type Sticker = {
  src: string;
  w: number;
  h: number;
  left: number;
  top: number;
  width: number;
  z: number;
  parts?: Part[];
  dLeft?: number;
  dTop?: number;
  dWidth?: number;
};

const GOLD_STARS: Part[] = [
  { src: "/about/stars/gold-1.png", w: 92, h: 107, x: 0.0, y: 0.0, pw: 0.2212 },
  { src: "/about/stars/gold-9.png", w: 66, h: 65, x: 0.488, y: 0.5195, pw: 0.1587 },
  { src: "/about/stars/gold-5.png", w: 100, h: 104, x: 0.601, y: 0.3321, pw: 0.2404 },
  { src: "/about/stars/gold-12.png", w: 95, h: 82, x: 0.4639, y: 0.679, pw: 0.2284 },
  { src: "/about/stars/gold-3.png", w: 79, h: 80, x: 0.3846, y: 0.1206, pw: 0.1899 },
  { src: "/about/stars/gold-10.png", w: 69, h: 67, x: 0.0457, y: 0.564, pw: 0.1659 },
  { src: "/about/stars/gold-7.png", w: 65, h: 67, x: 0.1731, y: 0.4416, pw: 0.1562 },
  { src: "/about/stars/gold-13.png", w: 89, h: 109, x: 0.3197, y: 0.7978, pw: 0.2139 },
  { src: "/about/stars/gold-6.png", w: 64, h: 65, x: 0.8462, y: 0.3785, pw: 0.1538 },
  { src: "/about/stars/gold-2.png", w: 89, h: 104, x: 0.1659, y: 0.0983, pw: 0.2139 },
  { src: "/about/stars/gold-11.png", w: 66, h: 68, x: 0.2885, y: 0.6104, pw: 0.1587 },
  { src: "/about/stars/gold-4.png", w: 120, h: 80, x: 0.1466, y: 0.3117, pw: 0.2885 },
  { src: "/about/stars/gold-8.png", w: 101, h: 91, x: 0.7572, y: 0.5102, pw: 0.2428 },
];

const PINK_STARS: Part[] = [
  { src: "/about/stars/pink-1.png", w: 77, h: 91, x: 0.0, y: 0.0, pw: 0.2567 },
  { src: "/about/stars/pink-6.png", w: 56, h: 54, x: 0.59, y: 0.7126, pw: 0.1867 },
  { src: "/about/stars/pink-4.png", w: 104, h: 68, x: 0.1733, y: 0.4282, pw: 0.3467 },
  { src: "/about/stars/pink-8.png", w: 55, h: 54, x: 0.3467, y: 0.8416, pw: 0.1833 },
  { src: "/about/stars/pink-2.png", w: 54, h: 54, x: 0.1933, y: 0.132, pw: 0.18 },
  { src: "/about/stars/pink-7.png", w: 57, h: 56, x: 0.0533, y: 0.7771, pw: 0.19 },
  { src: "/about/stars/pink-5.png", w: 83, h: 89, x: 0.7233, y: 0.4545, pw: 0.2767 },
  { src: "/about/stars/pink-3.png", w: 55, h: 54, x: 0.27, y: 0.2346, pw: 0.1833 },
];

// Order: first the stickers around the edges (they don't cover any text),
// then the ones that land on top of the text, so there's time to read first.
const STICKERS: Sticker[] = [
  { src: "/about/trix.png", w: 87, h: 87, left: 300, top: 72, width: 56, z: 1 },
  { src: "/about/mouse.png", w: 96, h: 96, left: 300, top: 180, width: 82, z: 3 },
  { src: "/about/take-it-easy.png", w: 92, h: 29, left: 20, top: 75, width: 58, z: 1 },
  { src: "/about/gecko.png", w: 172, h: 173, left: 266, top: 260, width: 104, z: 2 },
  { src: "/about/monkey.png", w: 65, h: 67, left: 210, top: 82, width: 36, z: 1 },
  { src: "/about/pointer.png", w: 80, h: 80, left: 252, top: 318, width: 50, z: 6 },
  { src: "/about/cat.png", w: 82, h: 64, left: 30, top: 172, width: 66, z: 1 },
  { src: "/about/charlie.png", w: 140, h: 249, left: 135, top: 78, width: 62, z: 2 },
  { src: "/about/pink-stars.png", w: 300, h: 341, left: 60, top: 245, width: 92, z: 4, parts: PINK_STARS },
  { src: "/about/cool.png", w: 71, h: 61, left: 178, top: 285, width: 58, z: 3 },
  { src: "/about/catgirl.png", w: 105, h: 105, left: 118, top: 222, width: 74, z: 3 },
  { src: "/about/gold-stars.png", w: 416, h: 539, left: 165, top: 125, width: 140, z: 5, parts: GOLD_STARS },
];

// Timing: the stickers start slow and come faster and faster.
const FIRST_DELAY = 10000; // ms before the first sticker appears (10 seconds)
const START_GAP = 7000; // ms between the first and second sticker
const SPEED_UP = 0.8; // each next gap is this much of the previous one (lower = speeds up faster)
const MIN_GAP = 1200; // the gap never gets shorter than this
const STAR_GAP = 220; // ms between the stars of a star sticker
const POPUP_DELAY = 5000; // ms after the last sticker (and its stars) before the "Hello?" poster pops up
const AFTER_GAME_DELAY = 4000; // if someone's playing Snake, wait until the game ends + this long

// Phone layout -> desktop layout: lines up the text column and photo of the
// two designs, and makes the stickers a bit smaller on the wider screen.
function toDesktop(s: Sticker) {
  return {
    left: s.dLeft ?? s.left * 0.99 - 22,
    top: s.dTop ?? s.top * 0.61 - 34.4,
    width: s.dWidth ?? s.width * 0.8,
  };
}

// Position + size (phone and desktop) for a sticker, via CSS variables.
const placeClass =
  "absolute left-[calc(var(--l)*var(--spacing))] top-[calc(var(--t)*var(--spacing))] w-[calc(var(--w)*var(--spacing))] md:left-[calc(var(--dl)*var(--spacing))] md:top-[calc(var(--dt)*var(--spacing))] md:w-[calc(var(--dw)*var(--spacing))]";
const popClass = "animate-pop motion-reduce:animate-fade-in";

function placeStyle(s: Sticker): CSSProperties {
  const d = toDesktop(s);
  return {
    "--l": s.left,
    "--t": s.top,
    "--w": s.width,
    "--dl": d.left,
    "--dt": d.top,
    "--dw": d.width,
    zIndex: s.z,
  } as CSSProperties;
}

export default function Stickers() {
  const [count, setCount] = useState(0);
  const [popup, setPopup] = useState<"waiting" | "open" | "closed">("waiting");
  const closePopup = useCallback(() => setPopup("closed"), []);

  // Once every sticker is on, wait a moment, then the "Hello?" poster is due.
  const [due, setDue] = useState(false);
  useEffect(() => {
    if (count < STICKERS.length) return;
    const last = STICKERS[STICKERS.length - 1];
    const starsTime = (last.parts?.length ?? 0) * STAR_GAP;
    const t = setTimeout(() => setDue(true), starsTime + POPUP_DELAY);
    return () => clearTimeout(t);
  }, [count]);

  // Never interrupt a game of Snake: wait until nobody's playing, and give
  // the game-over screen a few seconds first.
  const playing = useSyncExternalStore(gameState.subscribe, gameState.isPlaying, gameState.serverSnapshot);
  useEffect(() => {
    if (!due || playing || popup !== "waiting") return;
    const wait = Math.max(0, gameState.lastGameEnd() + AFTER_GAME_DELAY - Date.now());
    const t = setTimeout(() => setPopup("open"), wait);
    return () => clearTimeout(t);
  }, [due, playing, popup]);

  // Stickers appear one by one: slow at first, then faster and faster.
  useEffect(() => {
    let shown = 0;
    let gap = START_GAP;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      shown += 1;
      setCount(shown);
      if (shown >= STICKERS.length) return;
      timer = setTimeout(next, gap);
      gap = Math.max(MIN_GAP, gap * SPEED_UP);
    };
    timer = setTimeout(next, FIRST_DELAY);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {popup === "open" && <HelloPopup onClose={closePopup} />}
      <div className="pointer-events-none absolute inset-0 z-5" aria-hidden="true">
        {STICKERS.slice(0, count).map((s) =>
          s.parts ? (
            // A star sticker: an empty frame the size of the whole sticker, with
            // each star popping in at its own spot, one after another.
            <div key={s.src} className={placeClass} style={{ ...placeStyle(s), aspectRatio: `${s.w} / ${s.h}` }}>
              {s.parts.map((p, i) => (
                <Image
                  key={p.src}
                  src={p.src}
                  width={p.w}
                  height={p.h}
                  alt=""
                  unoptimized
                  className={`absolute h-auto ${popClass}`}
                  style={{
                    left: `${p.x * 100}%`,
                    top: `${p.y * 100}%`,
                    width: `${p.pw * 100}%`,
                    animationDelay: `${i * STAR_GAP}ms`,
                  }}
                />
              ))}
            </div>
          ) : (
            <Image
              key={s.src}
              src={s.src}
              width={s.w}
              height={s.h}
              alt=""
              unoptimized
              className={`${placeClass} h-auto ${popClass}`}
              style={{ ...placeStyle(s), height: "auto" }}
            />
          )
        )}
      </div>
    </>
  );
}