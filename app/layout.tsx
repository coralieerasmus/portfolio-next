import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
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
      <body className="font-sans">{children}</body>
    </html>
  );
}
