"use client";

import { useEffect, useRef } from "react";

// Custom cursor: a normal arrow, like your laptop's, that follows the mouse
// with a tiny delay. FOLLOW below sets how quickly it catches up (1 = instantly,
// lower = lazier).
// - It inverts what's underneath (mix-blend "difference"): black on the light
//   pages, light over dark areas and photos, so it's always visible.
// - Grows a little over anything clickable (links, buttons, clickable 3D objects).
// - Shows a label next to it over anything with data-cursor="...", or when a
//   page sets document.body.dataset.cursorLabel.
// - Shrinks a little while the mouse button is held.
// Only on devices with a mouse; phones and tablets keep their normal behaviour.

const FOLLOW = 0.5;
const SIZE = 22; // height of the arrow in pixels

const CSS = `
@media (pointer: fine) {
  html.has-custom-cursor, html.has-custom-cursor * { cursor: none !important; }
}
`;

export default function Cursor() {
  const arrow = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const a = arrow.current;
    const l = label.current;
    if (!a || !l) return;
    document.documentElement.classList.add("has-custom-cursor");

    let mx = -100;
    let my = -100;
    let x = -100;
    let y = -100;
    let scale = 1;
    let target = 1;
    let press = 1;
    let visible = 0;
    let raf = 0;

    const move = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      visible = 1;
      const t = e.target as HTMLElement | null;
      const tagged = t?.closest?.("[data-cursor]") as HTMLElement | null;
      const text = tagged?.dataset.cursor || document.body.dataset.cursorLabel || "";
      const clickable =
        !!t?.closest?.("a, button, [role='button'], label, summary") || t?.style?.cursor === "pointer";
      target = clickable ? 1.25 : text ? 1.1 : 1;
      if (l.textContent !== text) l.textContent = text;
    };
    const down = () => (press = 0.8);
    const up = () => (press = 1);
    const out = () => (visible = 0);

    const loop = () => {
      x += (mx - x) * FOLLOW;
      y += (my - y) * FOLLOW;
      scale += (target * press - scale) * 0.3;
      // The tip of the arrow is the exact mouse position (it grows from the tip).
      a.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale.toFixed(3)})`;
      a.style.opacity = String(visible);
      l.style.transform = `translate3d(${x + 18}px, ${y + SIZE}px, 0)`;
      l.style.opacity = l.textContent ? String(visible) : "0";
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.addEventListener("pointerleave", out);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("pointerleave", out);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <style>{CSS}</style>
      {/* Drawn white + "difference" blend = shows as black on light backgrounds, light on dark ones. */}
      <div
        ref={arrow}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[200] origin-top-left opacity-0 mix-blend-difference"
      >
        <svg width={(SIZE * 14) / 20} height={SIZE} viewBox="0 0 14 20" className="block" aria-hidden="true">
          <path d="M0 0V17.5L4.6 13.3L7.6 20L10.4 18.8L7.5 12.3H13.8Z" fill="#fff" strokeLinejoin="round" />
        </svg>
      </div>
      <span
        ref={label}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[200] whitespace-nowrap text-[13px] tracking-[-0.01em] text-white opacity-0 mix-blend-difference"
      />
    </>
  );
}