"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A line that keeps sliding to the left, like a ticker board.
// - It speeds up while you scroll and settles back to its normal pace after.
// - Hovering pauses it.
// - With `draggable`, you can grab it and throw it either way: it keeps
//   sliding with your throw, then slows back down to its normal pace.
// The content is shown twice back to back so the loop has no gap.

type Props = {
  children: ReactNode;
  seconds?: number; // time for one full loop at normal speed (higher = slower)
  draggable?: boolean;
  className?: string;
};

export default function Ticker({ children, seconds = 45, draggable = false, className = "" }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    const area = box.current;
    if (!el || !area) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let x = 0;
    let boost = 0; // extra speed from scrolling the page
    let fling = 0; // px per second left over from a drag-and-throw (+ = right)
    let lastY = window.scrollY;
    let last = performance.now();
    let hovering = false;
    let dragging = false;
    let dragX = 0; // pointer x at the previous move
    let dragT = 0;
    let dragVel = 0;
    let raf = 0;

    const wrap = () => {
      const half = el.scrollWidth / 2;
      if (!half) return;
      while (-x >= half) x += half;
      while (x > 0) x -= half;
    };

    const onScroll = () => {
      boost = Math.min(boost + Math.abs(window.scrollY - lastY) * 0.05, 6);
      lastY = window.scrollY;
    };
    const enter = () => (hovering = true);
    const leave = () => (hovering = false);

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      dragX = e.clientX;
      dragT = performance.now();
      dragVel = 0;
      fling = 0;
      area.setPointerCapture(e.pointerId);
      area.dataset.dragging = "true";
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - dragX;
      const dt = Math.max(now - dragT, 1) / 1000;
      x += dx;
      wrap();
      el.style.transform = `translate3d(${x}px, 0, 0)`;
      dragVel = dragVel * 0.6 + (dx / dt) * 0.4; // smoothed, so the throw feels right
      dragX = e.clientX;
      dragT = now;
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      delete area.dataset.dragging;
      if (area.hasPointerCapture(e.pointerId)) area.releasePointerCapture(e.pointerId);
      // A pause before letting go means no throw.
      fling = performance.now() - dragT > 80 ? 0 : Math.max(-4000, Math.min(4000, dragVel));
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!dragging) {
        const half = el.scrollWidth / 2;
        const base = reduce || hovering ? 0 : (half / seconds) * (1 + boost);
        x += (fling - base) * dt;
        wrap();
        el.style.transform = `translate3d(${x}px, 0, 0)`;
      }
      boost *= Math.exp(-3 * dt);
      fling *= Math.exp(-2.5 * dt);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    area.addEventListener("pointerenter", enter);
    area.addEventListener("pointerleave", leave);
    if (draggable) {
      area.addEventListener("pointerdown", down);
      area.addEventListener("pointermove", move);
      area.addEventListener("pointerup", up);
      area.addEventListener("pointercancel", up);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      area.removeEventListener("pointerenter", enter);
      area.removeEventListener("pointerleave", leave);
      area.removeEventListener("pointerdown", down);
      area.removeEventListener("pointermove", move);
      area.removeEventListener("pointerup", up);
      area.removeEventListener("pointercancel", up);
    };
  }, [seconds, draggable]);

  return (
    <div
      ref={box}
      data-cursor={draggable ? "drag" : undefined}
      className={`overflow-hidden ${
        draggable ? "cursor-grab touch-pan-y select-none data-[dragging]:cursor-grabbing" : ""
      } ${className}`}
    >
      <div ref={track} className="flex w-max will-change-transform">
        <div className="shrink-0">{children}</div>
        <div className="shrink-0" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}