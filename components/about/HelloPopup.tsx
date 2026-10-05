"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

// "Hello? Is it me you're looking for?" poster with tear-off tabs.
// Tearing a tab plays a rip animation, then opens an email to Coralie.

const EMAIL = "coralierasmus@gmail.com";
const SUBJECT = "Hello? Is it me you're looking for?";
const BODY = "Hi Coralie,\n\nI tore a tab off your poster, so here I am.\n\n";
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;

// Tab glow colours, left to right. "torn" = already torn off, like the design.
const TABS: ("lime" | "pink" | "cyan" | "torn")[] = ["lime", "pink", "torn", "lime", "pink", "cyan", "lime"];
const GLOW = { lime: "#d1fb53", pink: "#f898d0", cyan: "#7ee3f0" };

const TEAR_MS = 800; // must match the tear animation in globals.css

// Ripped paper edge, used for torn stubs and the falling piece.
const RIP_TOP = "polygon(0 6%, 18% 2%, 34% 7%, 52% 1%, 70% 8%, 86% 3%, 100% 7%, 100% 100%, 0 100%)";
const RIP_BOTTOM = "polygon(0 0, 100% 0, 100% 62%, 84% 88%, 66% 64%, 48% 96%, 30% 70%, 14% 92%, 0 74%)";

type TabState = "whole" | "tearing" | "torn";

export default function HelloPopup({ onClose }: { onClose: () => void }) {
  const [tabs, setTabs] = useState<TabState[]>(() => TABS.map((t) => (t === "torn" ? "torn" : "whole")));
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // While open: Escape closes, the page behind doesn't scroll, focus starts on the X.
  useEffect(() => {
    if (!mounted) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mounted, onClose]);

  const tear = (i: number) => {
    if (tabs[i] !== "whole") return;
    setTabs((t) => t.map((s, j) => (j === i ? "tearing" : s)));
    window.setTimeout(() => {
      setTabs((t) => t.map((s, j) => (j === i ? "torn" : s)));
      window.location.href = MAILTO;
    }, TEAR_MS);
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hello-title"
        onClick={(e) => e.stopPropagation()}
        className="@container relative w-[min(92vw,calc(84dvh*594/713),460px)] animate-pop drop-shadow-[0_16px_30px_rgba(0,0,0,0.35)]"
      >
        <h2 id="hello-title" className="sr-only">
          Hello? Is it me you&apos;re looking for? Tear off a tab to send Coralie a message.
        </h2>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-3 -top-3 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-md transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink"
        >
          <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <Image
          src="/about/hello-poster.png"
          alt="Hello? A black and white photo of a man hugging himself, smiling. Is it me you're looking for?"
          width={594}
          height={548}
          className="block h-auto w-full"
          priority
        />

        {/* Tear-off tabs. The strip itself is see-through: each tab is its own
            piece of paper, so a torn-off tab leaves a real gap. */}
        <div className="flex aspect-[594/165]">
          {TABS.map((color, i) => {
            const state = tabs[i];
            const glow = color === "torn" ? GLOW.lime : GLOW[color];
            return (
              <div key={i} className="relative flex-1">
                {state !== "whole" && (
                  // What's left after tearing: a ripped stub of paper at the top.
                  <div className="h-[14%] bg-[#f7f7f7]" style={{ clipPath: RIP_BOTTOM }} aria-hidden="true" />
                )}
                {state !== "torn" && (
                  <button
                    type="button"
                    onClick={() => tear(i)}
                    disabled={state === "tearing"}
                    aria-label={`Tear off a tab to email ${EMAIL}`}
                    className={`absolute inset-0 flex cursor-pointer items-center justify-center overflow-hidden bg-[#f7f7f7] ${i > 0 ? "border-l border-dashed border-black/30" : ""} px-[1cqw] py-[1.5cqw] transition-transform hover:-translate-y-[2%] hover:-rotate-1 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-black ${
                      state === "tearing" ? "pointer-events-none animate-tear motion-reduce:animate-fade-in" : ""
                    }`}
                    style={state === "tearing" ? { clipPath: RIP_TOP, transformOrigin: "50% 0" } : undefined}
                  >
                    <span
                      className="flex max-h-full flex-col items-start gap-[1cqw] [writing-mode:vertical-rl] rotate-180 text-left text-black [text-shadow:var(--glow)]"
                      style={
                        {
                          "--glow": `0 0 1px ${glow}, 1px 1px 0 ${glow}, -1px -1px 0 ${glow}, 1px -1px 0 ${glow}, -1px 1px 0 ${glow}`,
                        } as CSSProperties
                      }
                    >
                      <span className="whitespace-nowrap text-[4.2cqw] font-medium leading-[0.85] tracking-[-0.03em]">
                        Send me a<br />
                        message!
                      </span>
                      <span className="whitespace-nowrap text-[1.75cqw] leading-none tracking-[-0.01em]">{EMAIL}</span>
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}