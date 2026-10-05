import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SnakeGame from "@/components/about/SnakeGame";
import Stickers from "@/components/about/Stickers";

export const metadata: Metadata = {
  title: "this is me | Coralie Erasmus",
  description: "About Coralie Erasmus, designer and frontend developer from Eindhoven.",
};

const FIELDS =
  "UI/UX Designer, Frontend Developer, Graphic Designer, Creative Direction, Prototyping, Custom Product Design, Marketing Graphics Design, Immersive Experience Design, Visual & Brand Identity Creation.";

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
// Text sizes use the same unit: text-[calc(8*var(--spacing))] = 8 in the design.
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
            <div className="absolute left-240 top-92 z-0 h-138 w-112 overflow-hidden md:left-245 md:top-31.5 md:h-102.5 md:w-82">
              <Image
                src="/about/coralie.png"
                alt="Coralie smiling in a doorway, holding one foot up"
                fill
                sizes="(max-width: 767px) 30vw, 24vw"
                quality={90}
                priority
                className="object-cover"
              />
            </div>

            <section className="absolute left-55 top-96 z-1 w-222 text-pink md:left-32.5 md:top-24 md:w-225">
              <h1 className={heading}>About me</h1>
              <p className={copy}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec et elementum turpis. Nulla facilisi.
                Ut nisl risus, finibus id justo id, ultricies imperdiet nisi. Vestibulum posuere est vel nibh
                volutpat rutrum. Mauris eu venenatis mauris. Etiam vitae orci at mi ultricies elementum. Donec ut
                neque ut tellus posuere feugiat. Pellentesque ac felis eget arcu convallis congue. Quisque pulvinar
                maximus pharetra. Aliquam erat volutpat. Nulla malesuada blandit purus non tempor. Nulla pharetra
                pretium orci, a suscipit mauris egestas sit amet. Aenean ut scelerisque magna. Nullam aliquam justo
                vel neque mollis, non porttitor odio volutpat.
              </p>
            </section>

            <section className="absolute left-55 top-276 z-1 w-222 text-pink md:left-32.5 md:top-132 md:w-235">
              <h2 className={heading}>About my brain</h2>
              <p className={copy}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec et elementum turpis. Nulla facilisi.
                Ut nisl risus, finibus id justo id, ultricies imperdiet nisi. Vestibulum posuere est vel nibh
                volutpat rutrum. Mauris eu venenatis mauris. Vestibulum posuere est vel nibh volutpat rutrum. Mauris
                eu venenatis mauris.
              </p>
            </section>

            <p className="absolute left-91 top-400 w-220 text-center text-[calc(13.5*var(--spacing))] leading-none tracking-[-0.01em] md:left-0 md:top-192 md:w-full md:text-[calc(8*var(--spacing))]">
              Too much information? Rest your mind and play a game.
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

      <footer className="bg-sky pb-[calc(env(safe-area-inset-bottom,0px)+28px)] text-black">
        <div className={column}>
          <div className={`${design} px-14 pb-10 pt-18 md:px-6 md:pb-6 md:pt-8`}>
            <Link
              href="/"
              aria-label="Back to the home page"
              className="inline-block w-54 text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black md:w-37.5"
            >
              <svg viewBox="0 0 54 14" aria-hidden="true" className="block h-auto w-full">
                <path d="M53 7H2M8 1L2 7l6 6" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="border-y border-black">
          <div className={column}>
            <h2
              className={`${design} px-14 py-4 text-[calc(9*var(--spacing))] md:px-7.5 md:py-5.5 md:text-[calc(6*var(--spacing))]`}
            >
              fields of work
            </h2>
          </div>
        </div>

        <div className={column}>
          <div className={`${design} px-14 pt-34 md:px-7.5 md:pb-4 md:pt-7.5`}>
            <p className="text-[calc(17.5*var(--spacing))] leading-[1.37] tracking-[-0.01em] md:text-[calc(10*var(--spacing))] md:leading-[1.25]">
              {FIELDS}
            </p>
            <a
              href="mailto:coralierasmus@gmail.com"
              className="mt-40 inline-block text-[calc(20.5*var(--spacing))] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black md:mt-13.5 md:text-[calc(8.5*var(--spacing))]"
            >
              coralierasmus@gmail.com
            </a>
            <p className="mt-20 text-[calc(8*var(--spacing))] leading-[1.3] md:mt-18 md:text-[calc(4*var(--spacing))]">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              <br className="md:hidden" /> Donec et elementum turpis. Nulla facilisi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}