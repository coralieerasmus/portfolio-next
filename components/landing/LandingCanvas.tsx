"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Scene } from "./Scene";
import { createWorld, WorldContext } from "./world";

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

export default function LandingCanvas() {
  // Created once per page visit; the physics loop mutates it directly.
  const [world] = useState(createWorld);

  // Clicking an object opens its page (its href in objects.ts).
  const router = useRouter();
  useEffect(() => {
    world.navigate = (href) => router.push(href);
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
    </>
  );
}