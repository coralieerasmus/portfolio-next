"use client";

import { useEffect, useRef, type CSSProperties } from "react";

// Scroll effects. Put <ScrollReveal /> once on a page.
// - "reveal-img": fades and rises in when it scrolls into view.
// - "reveal-text": slides in word by word (wrap the text in <Words>).
// - data-parallax="0.08": moves a little slower than the page while
//   scrolling (desktop only). Higher number = more movement.
// - <ScrollReveal progress />: also shows a thin pink line at the top that
//   fills up as you scroll down the page.
// If someone has reduced motion turned on, everything simply shows without moving.

const CSS = `
.reveal-ready .reveal-img {
  opacity: 0;
  transform: translateY(48px) scale(0.98);
  transition: opacity 0.9s ease, transform 1.2s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.reveal-ready .reveal-img.is-in { opacity: 1; transform: none; }

.reveal-text .w { display: inline-block; overflow: hidden; vertical-align: top; padding-bottom: 0.08em; margin-bottom: -0.08em; }
.reveal-text .w > span { display: inline-block; }
.reveal-ready .reveal-text .w > span {
  transform: translateY(110%);
  transition: transform 0.75s cubic-bezier(0.2, 0.7, 0.2, 1);
  transition-delay: calc(var(--i) * 16ms);
}
.reveal-ready .reveal-text.is-in .w > span { transform: none; }

@media (prefers-reduced-motion: reduce) {
  .reveal-ready .reveal-img,
  .reveal-ready .reveal-text .w > span { opacity: 1; transform: none; transition: none; }
}
`;

// Wraps every word in its own span so the words can slide in one by one.
// The spaces stay real spaces, so justified text still lines up.
export function Words({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          <span className="w">
            <span style={{ "--i": i } as CSSProperties}>{w}</span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

export default function ScrollReveal({ progress = false }: { progress?: boolean }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 768px)");
    root.classList.add("reveal-ready");

    // Reveal on scroll.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal-img, .reveal-text").forEach((el) => observer.observe(el));

    // Parallax + progress line, updated once per frame while scrolling.
    const parallax = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const el of parallax) {
        if (reduce || !desktop.matches) {
          el.style.translate = "";
          continue;
        }
        const speed = Number(el.dataset.parallax) || 0;
        const r = el.getBoundingClientRect();
        const fromCenter = r.top + r.height / 2 - vh / 2;
        el.style.translate = `0 ${(-fromCenter * speed).toFixed(1)}px`;
      }
      if (bar.current) {
        const max = document.documentElement.scrollHeight - vh;
        bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      root.classList.remove("reveal-ready");
    };
  }, []);

  return (
    <>
      <style>{CSS}</style>
      {progress && (
        <div
          ref={bar}
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-[160] h-1 origin-left bg-pink"
          style={{ transform: "scaleX(0)" }}
        />
      )}
    </>
  );
}