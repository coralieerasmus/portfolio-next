import HomeStar from "@/components/HomeStar";

// Page transition. Next.js re-creates this wrapper every time you go to
// another page, so the lime panel below plays each time: it covers the
// screen and wipes up and away to reveal the new page.
// Also adds the black home star in the top-left corner (not on the landing page).

const CSS = `
@keyframes page-wipe { from { transform: translateY(0); } to { transform: translateY(-100%); } }
.page-wipe { animation: page-wipe 0.85s cubic-bezier(0.7, 0, 0.2, 1) 0.05s both; }
@media (prefers-reduced-motion: reduce) { .page-wipe { display: none; } }
`;

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HomeStar />
      <style>{CSS}</style>
      <div aria-hidden="true" className="page-wipe pointer-events-none fixed inset-0 z-[150] bg-lime" />
    </>
  );
}