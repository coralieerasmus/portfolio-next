"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Scene } from "./Scene";
import { createWorld, WorldContext } from "./world";

function LoadingLabel() {
  const { progress, active } = useProgress();
  const done = !active && progress === 100;
  return (
    <p
      aria-live="polite"
      className={`absolute bottom-[calc(env(safe-area-inset-bottom,0px)+20px)] left-6 z-10 text-sm transition-opacity duration-400 ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {done ? "" : `loading ${Math.round(progress)}%`}
    </p>
  );
}

export default function LandingCanvas() {
  // Created once per page visit; the physics loop mutates it directly.
  const [world] = useState(createWorld);

  return (
    <>
      <div className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing" aria-hidden="true">
        <WorldContext.Provider value={world}>
          <Canvas
            camera={{ position: [0, 0, 10], fov: 30 }}
            shadows="percentage"
            dpr={[1, 2]}
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