"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";

// One scratch-off lottery circle. A grey "scratch card" layer covers the
// project picture. Moving the mouse over it (or dragging a finger) scratches
// the grey away. Once enough is scratched, the rest falls away and the circle
// becomes a link to the project.

const BRUSH = 0.16; // scratch line thickness, as a fraction of the circle size
const REVEAL_AT = 0.5; // how much must be scratched before it fully reveals (0.5 = half)

type Props = {
  href: string;
  src: string;
  alt: string;
  title: string; // read out by screen readers
};

// Draws the silver-grey scratch-card coating.
function paintCoating(ctx: CanvasRenderingContext2D, size: number) {
  const g = ctx.createRadialGradient(size * 0.35, size * 0.3, size * 0.05, size / 2, size / 2, size * 0.75);
  g.addColorStop(0, "#d9d9d9");
  g.addColorStop(1, "#a7a7a7");
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // Fine speckle, like real scratch-card foil.
  const dots = Math.round(size * size * 0.004);
  for (let i = 0; i < dots; i++) {
    const light = Math.random() > 0.5;
    ctx.fillStyle = light ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.12)";
    ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5);
  }
}

export default function ScratchCircle({ href, src, alt, title }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [gone, setGone] = useState(false); // coating fully faded out and removed

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let size = 0;
    let last: { x: number; y: number } | null = null;
    let drawing = false;
    let strokes = 0;
    let done = false;

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.round(c.clientWidth * dpr);
      if (!size) return;
      c.width = size;
      c.height = size;
      paintCoating(ctx, size);
    };

    const point = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * size, y: ((e.clientY - r.top) / r.height) * size };
    };

    const scratch = (p: { x: number; y: number }) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = size * BRUSH;
      ctx.beginPath();
      ctx.moveTo(last?.x ?? p.x, last?.y ?? p.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
      if (++strokes % 6 === 0) checkProgress();
    };

    // Count how much of the circle is scratched (sampled, inside the circle only).
    const checkProgress = () => {
      if (done) return;
      const data = ctx.getImageData(0, 0, size, size).data;
      const step = Math.max(4, Math.round(size / 60));
      const rr = (size / 2) ** 2;
      let total = 0;
      let clear = 0;
      for (let y = step / 2; y < size; y += step) {
        for (let x = step / 2; x < size; x += step) {
          if ((x - size / 2) ** 2 + (y - size / 2) ** 2 > rr) continue;
          total++;
          if (data[(Math.floor(y) * size + Math.floor(x)) * 4 + 3] < 128) clear++;
        }
      }
      if (total && clear / total >= REVEAL_AT) {
        done = true;
        setRevealed(true);
      }
    };

    const move = (e: PointerEvent) => {
      // Mouse scratches just by moving over it; touch/pen while pressed.
      if (e.pointerType === "mouse" || drawing) scratch(point(e));
    };
    const down = (e: PointerEvent) => {
      drawing = true;
      last = null;
      scratch(point(e));
    };
    const up = () => {
      drawing = false;
      last = null;
      checkProgress();
    };
    const leave = () => {
      last = null;
    };

    setup();
    const ro = new ResizeObserver(() => {
      if (!done) setup();
    });
    ro.observe(c);
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerdown", down);
    c.addEventListener("pointerleave", leave);
    window.addEventListener("pointerup", up);
    return () => {
      ro.disconnect();
      c.removeEventListener("pointermove", move);
      c.removeEventListener("pointerdown", down);
      c.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  // Clicking only opens the project once it's revealed. (Keyboard users can
  // always open it: a keyboard "click" has e.detail === 0.)
  const onClick = (e: MouseEvent) => {
    if (!revealed && e.detail !== 0) e.preventDefault();
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={title}
      data-cursor={revealed ? "view project" : "scratch"}
      className="group relative block aspect-square overflow-hidden rounded-full bg-[#bdbdbd] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 768px) 22vw, 30vw"
        className={`object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
          revealed ? "group-hover:scale-[1.06]" : ""
        }`}
      />
      {!gone && (
        <canvas
          ref={canvas}
          aria-hidden="true"
          onTransitionEnd={() => revealed && setGone(true)}
          className={`absolute inset-0 size-full touch-none transition-opacity duration-500 ${
            revealed ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        />
      )}
    </Link>
  );
}