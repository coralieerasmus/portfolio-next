import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { Media } from "@/content/projects";

// One image or video. Its box always keeps the file's shape (ratio), so the
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
};

export default function ProjectMedia({ media, sizes, eager, className = "", style }: Props) {
  const box = `relative overflow-hidden bg-black/[0.06] ${className}`;
  const boxStyle = { aspectRatio: String(media.ratio), ...style };

  if (!fileExists(media.src)) {
    return (
      <div className={box} style={boxStyle} role="img" aria-label={media.alt}>
        <span className="absolute inset-0 flex items-center justify-center p-3 text-center text-[11px] text-black/45">
          add {media.src}
        </span>
      </div>
    );
  }

  if (media.type === "video") {
    return (
      <div className={box} style={boxStyle}>
        <video
          src={media.src}
          aria-label={media.alt}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={box} style={boxStyle}>
      <Image
        src={media.src}
        alt={media.alt}
        fill
        sizes={sizes}
        quality={90}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        className="object-cover"
      />
    </div>
  );
}
