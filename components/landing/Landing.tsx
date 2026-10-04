"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { GRAIN } from "./objects";

// three.js needs the browser (WebGL, window), so the 3D part is only loaded on
// the client. The nav still renders on the server straight away.
const LandingCanvas = dynamic(() => import("./LandingCanvas"), { ssr: false });

const linkClass =
  "underline-offset-[3px] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

export default function Landing() {
  return (
    <main className="relative h-dvh w-full">
      <h1 className="sr-only">Coralie</h1>

      <nav
        aria-label="Main"
        className="absolute right-6 top-[calc(env(safe-area-inset-top,0px)+16px)] z-10 flex gap-[18px] text-sm tracking-[-0.01em]"
      >
        <Link href="/projects" className={linkClass}>
          projects
        </Link>
        <Link href="/about" className={linkClass}>
          this is me
        </Link>
      </nav>

      <LandingCanvas />

      {/* Film grain over everything. Clicks pass straight through it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-20"
        style={{
          backgroundImage: `url(${GRAIN.image})`,
          backgroundSize: `${GRAIN.tileWidth}px ${GRAIN.tileHeight}px`,
          opacity: GRAIN.opacity,
          mixBlendMode: GRAIN.blend,
        }}
      />
    </main>
  );
}