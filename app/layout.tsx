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

export const metadata: Metadata = {
  title: "Coralie",
  description: "Portfolio of Coralie",
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