import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { Media } from "@/content/projects";
import ModelViewer from "./ModelViewer";

// One image, video or 3D model. Its box always keeps the file's shape (ratio), so the
// page doesn't jump while loading. A file that isn't in /public yet shows a
// grey placeholder with its path, so you can see where it goes.

function fileExists(src: string) {
  return fs.existsSync(path.join(process.cwd(), "public", src));
}

type Props = {
  media: Media;
  sizes: string; // how wide it shows, so the browser picks the right file size
  eager?: boolean; // load straight away (the first image on the page)
  className?: string;
  style?: CSSProperties;
  parallax?: number; // desktop: drift speed while scrolling (see ScrollReveal)
};

export default function ProjectMedia({ media, sizes, eager, className = "", style, parallax }: Props) {
  const box = `group relative overflow-hidden bg-black/[0.06] ${className}`;
  const drift = parallax ? { "data-parallax": parallax } : {};
  // On hover the picture inside zooms in slightly (the frame stays put).
  const zoom =
    "transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.045] motion-reduce:transition-none motion-reduce:group-hover:scale-100";
  const boxStyle = { aspectRatio: String(media.ratio), ...style };

  if (!fileExists(media.src)) {
    return (
      <div className={box} style={boxStyle} role="img" aria-label={media.alt} {...drift}>
        <span className="absolute inset-0 flex items-center justify-center p-3 text-center text-[11px] text-black/45">
          add {media.src}
        </span>
      </div>
    );
  }

  if (media.type === "model") {
    // No grey box behind it, so the bottle floats on the page.
    return (
      <ModelViewer
        src={media.src}
        alt={media.alt}
        className={`relative ${className}`}
        style={boxStyle}
        parallax={parallax}
      />
    );
  }

  if (media.type === "video") {
    return (
      <div className={box} style={boxStyle} {...drift}>
        <video
          src={media.src}
          aria-label={media.alt}
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="metadata"
          className="absolute inset-0 size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={box} style={boxStyle} {...drift}>
      <Image
        src={media.src}
        alt={media.alt}
        fill
        sizes={sizes}
        quality={90}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        className={`object-cover ${zoom}`}
      />
    </div>
  );
}