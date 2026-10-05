import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Image qualities pages may ask for. 75 is Next's default; 90 is used
    // for photos that need to stay crisp (like the about-page portrait).
    qualities: [75, 90],
  },
};

export default nextConfig;