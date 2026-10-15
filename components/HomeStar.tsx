"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Black five-point star in the top-left corner of every page (except the
// landing page itself). Clicking it takes you back to the landing page.
// It turns a little and grows when you hover it.

export default function HomeStar() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <Link
      href="/"
      aria-label="Back to the home page"
      data-cursor="home"
      className="group absolute left-6 top-[calc(env(safe-area-inset-top,0px)+12px)] z-40 block size-7 text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black md:left-8 md:size-8"
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="size-full transition-transform duration-500 ease-[cubic-bezier(0.3,1.6,0.5,1)] group-hover:rotate-[72deg] group-hover:scale-110 group-active:scale-90 motion-reduce:transition-none"
      >
        <polygon
          points="50.0,4.0 61.2,36.6 95.7,37.2 68.1,57.9 78.2,90.8 50.0,71.0 21.8,90.8 31.9,57.9 4.3,37.2 38.8,36.6"
          fill="currentColor"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}