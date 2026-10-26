import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Cursor from "@/components/Cursor";
import "./globals.css";

// Main text font: used everywhere by default (Tailwind's font-sans).
const alte = localFont({
  src: [
    { path: "./fonts/AlteHaasGrotesk-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/AlteHaasGrotesk-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-alte",
  display: "swap",
});

// Title font: use it with the font-title class.
const nersans = localFont({
  src: "./fonts/NerSans.otf",
  variable: "--font-nersans",
  display: "swap",
});

// Slim pink scrollbar on every page (no grey track behind it).
const SCROLLBAR_CSS = `
html { scrollbar-width: thin; scrollbar-color: #ff56b6 transparent; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #ff56b6; border-radius: 999px; border: 2px solid transparent; background-clip: padding-box; }
::-webkit-scrollbar-thumb:hover { background-color: #e5249a; }
`;

// What Google, iMessage, WhatsApp, LinkedIn etc. show for the website.
// (The tab icon comes from icon.png, apple-icon.png and favicon.ico in this folder.)
const SITE_TITLE = "Coralie Erasmus | Designer & Frontend Developer";
const SITE_DESCRIPTION =
  "Portfolio of Coralie Erasmus, a designer and frontend developer from Eindhoven. UI/UX design, brand identity, typography, immersive installations and interactive websites.";

const SITE_URL = "https://coralieerasmus.com";

export const metadata: Metadata = {
  // Your own domain: Google and link previews use this as the main address.
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "Coralie Erasmus",
  authors: [{ name: "Coralie Erasmus" }],
  keywords: [
    "Coralie Erasmus",
    "portfolio",
    "designer",
    "frontend developer",
    "UI/UX design",
    "brand identity",
    "Eindhoven",
  ],
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Coralie Erasmus",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  // iPhone: name under the icon when someone adds the site to their home screen.
  appleWebApp: { title: "Coralie" },
};

export const viewport: Viewport = {
  themeColor: "#d1fb53",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${alte.variable} ${nersans.variable}`}>
      <body className="font-sans">
        <style>{SCROLLBAR_CSS}</style>
        {children}
        {/* Custom mouse cursor on every page (mouse/trackpad only). */}
        <Cursor />
      </body>
    </html>
  );
}