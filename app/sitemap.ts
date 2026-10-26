import type { MetadataRoute } from "next";
import { PROJECTS } from "@/content/projects";

// List of every page on the site, for Google (served at /sitemap.xml).
// Project pages are added automatically from content/projects.ts.

const SITE_URL = "https://coralieerasmus.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/projects`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.7 },
    ...PROJECTS.map((p) => ({
      url: `${SITE_URL}/projects/${p.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}