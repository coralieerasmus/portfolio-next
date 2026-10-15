import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SnakeGame from "@/components/about/SnakeGame";
import Stickers from "@/components/about/Stickers";
import ProjectFooter from "@/components/projects/ProjectFooter";
import ScrollReveal, { Words } from "@/components/projects/ScrollReveal";
import TiltPhoto from "@/components/about/TiltPhoto";

export const metadata: Metadata = {
  title: "this is me | Coralie Erasmus",
  description: "About Coralie Erasmus, designer and frontend developer from Eindhoven.",
};

// Stickers wiggle when you hover over them. (The pop-in animation is listed
// again so it doesn't replay; the wiggle uses "rotate" so the two don't clash.)
const STICKER_CSS = `
[data-page="about"] img[src^="/about/"] { pointer-events: auto; }
@keyframes sticker-wiggle {
  0%, 100% { rotate: 0deg; }
  20% { rotate: -9deg; }
  45% { rotate: 7deg; }
  70% { rotate: -4deg; }
  85% { rotate: 2deg; }
}
@media (prefers-reduced-motion: no-preference) {
  [data-page="about"] img[src^="/about/"]:hover {
    animation: pop 650ms cubic-bezier(0.2, 1.6, 0.4, 1) both, sticker-wiggle 0.6s ease-in-out;
  }
}
`;

// HOW THE SIZING WORKS
// There are two designs: the phone design (402 wide) and the desktop design
// (390 wide in the wireframe). Inside the "design" wrappers, Tailwind's
// spacing unit is set to 1 pixel of whichever design is showing:
//   phones:           [--spacing:calc(100cqw/402)]
//   md (768px) and up: md:[--spacing:calc(100cqw/390)]
// So classes read straight from the designs: left-240 = 240 from the left in
// the phone design, md:left-245 = 245 from the left in the desktop design.
// On desktop the unit is also capped by the window height, so the whole
// "about" part (text, photo, stickers) always fits on screen when the page
// opens. Desktop positions are the wireframe's, moved up by 20 to sit higher.
const design = "[--spacing:calc(100cqw/402)] md:[--spacing:min(calc(100cqw/390),calc(100dvh/205))]";
const column = "@container mx-auto w-[min(100%,720px)] md:w-full";
const navLink =
  "text-pink underline-offset-[3px] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink";
const heading =
  "mb-9 font-title leading-none text-[calc(7.6*var(--spacing))] uppercase tracking-[0.01em] md:mb-5 md:text-[calc(12.5*var(--spacing))]";
const copy =
  "text-[calc(8.6*var(--spacing))] leading-[0.92] tracking-[-0.01em] md:text-[calc(5.6*var(--spacing))] md:leading-[0.93]";

export default function AboutPage() {
  return (
    <div data-page="about" className="min-h-dvh overflow-x-clip bg-white text-black">
      <nav
        aria-label="Main"
        className="absolute right-6 top-[calc(env(safe-area-inset-top,0px)+16px)] z-20 flex gap-[18px] text-sm tracking-[-0.01em]"
      >
        <Link href="/projects" className={navLink}>
          projects
        </Link>
        <Link href="/about" aria-current="page" className={`${navLink} font-semibold`}>
          this is me
        </Link>
      </nav>

      <main>
        <div className={column}>
          <div className={`${design} relative h-771 md:mx-auto md:h-407 md:w-390`}>
            <p className="absolute right-50 top-80 text-[calc(8*var(--spacing))] text-pink md:right-64 md:top-22.5 md:text-[calc(5.5*var(--spacing))]">
              coralie erasmus
            </p>
            <p className="absolute left-355 top-91 text-[calc(8*var(--spacing))] text-pink [writing-mode:vertical-rl] md:left-329 md:top-31.5 md:text-[calc(5.5*var(--spacing))]">
              eindhoven
            </p>

            {/* Photo sits underneath the text (z-0), text on top (z-1). */}
            <TiltPhoto className="absolute left-240 top-92 z-0 h-138 w-112 overflow-hidden md:left-245 md:top-31.5 md:h-102.5 md:w-82">
              <Image
                src="/about/coralie.png"
                alt="Coralie smiling in a doorway, holding one foot up"
                fill
                sizes="(max-width: 767px) 30vw, 24vw"
                quality={90}
                priority
                className="object-cover"
              />
            </TiltPhoto>

            <section className="absolute left-55 top-96 z-1 w-222 text-pink md:left-32.5 md:top-24 md:w-225">
              <h1 className={`reveal-text ${heading}`}>
                <Words text="About me" />
              </h1>
              <p className={`reveal-text ${copy}`}>
                <Words
                  text="Hey, I'm Coralie, a designer and front-end developer from Eindhoven. I'm ambitious, maybe even a little too much. I want to do everything, everywhere, all at once. That's why my work jumps from typefaces to websites, from brand identities to immersive installations. I love experimenting with design in every medium I can get my hands on, and I put my whole heart into every project. If it's creative, a little unexpected and makes people feel something, count me in."
                />
              </p>
            </section>

            <section className="absolute left-55 top-276 z-1 w-222 text-pink md:left-32.5 md:top-132 md:w-235">
              <h2 className={`reveal-text ${heading}`}>
                <Words text="About my brain" />
              </h2>
              <p className={`reveal-text ${copy}`}>
                <Words
                  text="My brain lives outside the box, and honestly, it can't always relate to people who stay inside it. It's a positive place, but a critical one too, so every idea gets thoroughly thought about. There's always music playing in there, and at least 20 tabs open. And yes, they're all important, I wouldn't have it any other way. Some say it's a little chaotic, but it keeps me on my toes and always ready for the next challenge."
                />
              </p>
            </section>

            <p className="reveal-text absolute left-91 top-400 w-220 text-center text-[calc(13.5*var(--spacing))] leading-none tracking-[-0.01em] md:left-0 md:top-192 md:w-full md:text-[calc(8*var(--spacing))]">
              <Words text="Too much information? Rest your mind and play a game." />
            </p>

            {/* Phones: a square board. Desktop: a yellow band across the whole window. */}
            <div className="absolute left-55 top-443 size-293 md:left-[calc(50%-50vw)] md:top-213.5 md:h-193.5 md:w-screen">
              <SnakeGame />
            </div>

            {/* Stickers that slowly pop up the longer you stay. */}
            <Stickers />
          </div>
        </div>
      </main>

      {/* Same footer as every other page. */}
      <ProjectFooter className="" />
      <ScrollReveal />
      <style>{STICKER_CSS}</style>
    </div>
  );
}