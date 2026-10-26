"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties } from "react";

// A 3D model on a project page (type: "model" in projects.ts).
// The 3D part only loads once you scroll near it, so the rest of the page
// stays fast. It slowly spins on its own; drag sideways to turn it yourself.
// It stands on a moody "stage": a deep wine-red glow with a soft pink light
// pool at its feet, floating specks of dust, and film grain over everything
// (the grain also hides the rough spots of the 3D model).

// The stage colours. Change these to restyle it.
const STAGE = {
  glow: "#7a1530", // the light behind the model
  mid: "#2b0710", // around it
  edge: "#0c0205", // the corners
  floor: "rgba(255, 86, 182, 0.28)", // soft pink pool of light under the model
};
// Film grain, the same texture as on the landing page.
const GRAIN = {
  image: "/textures/overlay.png",
  opacity: 0.55, // 0 = off, 1 = full strength
  tileWidth: 312,
  tileHeight: 820,
};

const ModelCanvas = dynamic(() => import("./ModelCanvas"), { ssr: false });

type Props = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  parallax?: number;
};

export default function ModelViewer({ src, alt, className = "", style, parallax }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);

  // Start loading when it's within one screen of being visible.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={box}
      role="img"
      aria-label={alt}
      data-cursor="drag to spin"
      data-parallax={parallax}
      className={`cursor-grab touch-pan-y select-none overflow-hidden text-white active:cursor-grabbing ${className}`}
      style={{
        background: `radial-gradient(ellipse 42% 9% at 50% 90%, ${STAGE.floor}, transparent 100%), radial-gradient(circle at 50% 42%, ${STAGE.glow} 0%, ${STAGE.mid} 52%, ${STAGE.edge} 100%)`,
        ...style,
      }}
    >
      {near && <ModelCanvas src={src} onReady={() => setReady(true)} />}

      {/* Shown until the model has loaded. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] transition-opacity duration-500 md:text-[14px] ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      >
        loading…
      </div>

      {/* Film grain over the model and the stage. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url(${GRAIN.image})`,
          backgroundSize: `${GRAIN.tileWidth}px ${GRAIN.tileHeight}px`,
          opacity: GRAIN.opacity,
          mixBlendMode: "overlay",
        }}
      />

      {/* Little hint underneath (phones don't get the cursor label). */}
      <p
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-3 text-center text-[10px] uppercase tracking-[0.02em] opacity-60 transition-opacity duration-500 md:hidden ${
          ready ? "" : "opacity-0"
        }`}
      >
        drag to spin
      </p>
    </div>
  );
}