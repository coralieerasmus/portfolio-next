"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Scene } from "./Scene";
import { OBJECTS } from "./objects";
import { createWorld, WorldContext, type World } from "./world";

// Loading screen: a slowly turning five-point star above the percentage, in the middle
// of the page. Fades away once every model has loaded.
function LoadingLabel() {
  const { progress, active } = useProgress();
  const done = !active && progress === 100;
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 transition-opacity duration-500 ${
        done ? "opacity-0" : "opacity-100"
      }`}
    >
      <svg width="56" height="56" viewBox="0 0 100 100" aria-hidden="true">
        {/* Five-point star */}
        <polygon points="50.0,4.0 61.2,36.6 95.7,37.2 68.1,57.9 78.2,90.8 50.0,71.0 21.8,90.8 31.9,57.9 4.3,37.2 38.8,36.6" fill="currentColor" strokeLinejoin="round">
          {!reducedMotion && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 50 52"
              to="360 50 52"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
        </polygon>
      </svg>
      <p className="text-2xl tracking-[-0.01em] tabular-nums">
        loading {Math.round(progress)}%
      </p>
    </div>
  );
}

// Little tag next to the cursor with the project name of the object you're
// hovering (each object's label in objects.ts). Hidden while you hold or drag.
function HoverTag({ world }: { world: World }) {
  const tag = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = tag.current;
    const t = text.current;
    if (!el || !t) return;
    let x = -200;
    let y = -200;
    let shown = 0;
    let raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
    };
    const loop = () => {
      const label = world.pressing || world.magnet ? null : world.hoverLabel;
      if (label && t.textContent !== label) t.textContent = label;
      shown += ((label ? 1 : 0) - shown) * 0.25;
      el.style.opacity = shown.toFixed(3);
      el.style.transform = `translate3d(${x + 18}px, ${y + 18}px, 0) scale(${(0.85 + 0.15 * shown).toFixed(3)})`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      world.hoverLabel = null;
    };
  }, [world]);

  return (
    <div
      ref={tag}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-30 flex origin-top-left items-center gap-1.5 whitespace-nowrap rounded-full border border-black bg-white px-3 py-1 text-[13px] tracking-[-0.01em] text-black opacity-0"
    >
      <span ref={text} />
      <span>↗</span>
    </div>
  );
}

// Lime panel that slides up the moment you click an object, so the click
// feels instant. The next page starts with the same lime panel (app/template.tsx)
// and wipes it away, so the two join up seamlessly.
const LEAVE_CSS = `
@keyframes leave-cover { from { transform: translateY(100%); } to { transform: translateY(0); } }
.leave-cover { animation: leave-cover 0.45s cubic-bezier(0.7, 0, 0.2, 1) both; }
@media (prefers-reduced-motion: reduce) { .leave-cover { animation: none; } }
`;

export default function LandingCanvas() {
  // Created once per page visit; the physics loop mutates it directly.
  const [world] = useState(createWorld);
  const [leaving, setLeaving] = useState(false);

  // Clicking an object opens its page (its href in objects.ts).
  const router = useRouter();
  useEffect(() => {
    world.navigate = (href) => {
      world.hoverLabel = null;
      setLeaving(true);
      router.push(href);
    };
    // Load every project page in the background straight away, so clicking
    // one opens it without waiting. (Only works on the live site / npm run
    // start; in npm run dev each page is still built the first time you open it.)
    OBJECTS.forEach((o) => {
      if (o.href) router.prefetch(o.href);
    });
    return () => {
      world.navigate = null;
    };
  }, [router, world]);

  return (
    <>
      <div className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing" aria-hidden="true">
        <WorldContext.Provider value={world}>
          <Canvas
            camera={{ position: [0, 0, 10], fov: 30 }}
            shadows="percentage"
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: true }}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.NeutralToneMapping;
            }}
          >
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
        </WorldContext.Provider>
      </div>
      <LoadingLabel />
      <HoverTag world={world} />
      {leaving && (
        <>
          <style>{LEAVE_CSS}</style>
          <div aria-hidden="true" className="leave-cover pointer-events-none fixed inset-0 z-[150] bg-lime" />
        </>
      )}
    </>
  );
}