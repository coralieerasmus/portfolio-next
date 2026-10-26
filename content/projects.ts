// All project pages are built from this list. To add a project, copy one
// entry and change it. The page lives at /projects/<slug>.
//
// Images go in public/projects/<slug>/ (e.g. public/projects/proxy/1.jpg).
// A missing file shows a grey placeholder with its file name, so you can
// see where it goes.
//
// MEDIA
//   src:   path inside /public
//   alt:   short description for screen readers
//   ratio: width / height of the file (1.5 = landscape 3:2, 0.667 = portrait 2:3)
//   mw:    width on phones, in pixels of the 402px-wide phone design
//          (402 = edge to edge)
//   type:  "video" for an .mp4 (plays silently on a loop)
//          "model" for a 3D model (.glb in public/models): it slowly spins
//          and visitors can drag to turn it. ratio = shape of its box.
//
// BLOCKS, in reading order:
//   { media: [one] }            one image or video
//   { media: [two], gap }       two side by side (gap in phone design px;
//                               leave it out for two images that touch)
//   { text: "..." }             a paragraph
//
// Videos (type: "video") play silently on a loop; viewers can turn the sound
// on with the controls.
//
// On desktop the page builds its own layout from the same list: the first
// image is the big opener, then images and their paragraphs alternate
// left and right.

export type Media = {
  src: string;
  alt: string;
  ratio: number;
  mw: number;
  type?: "image" | "video" | "model";
};

export type Block = { media: Media[]; gap?: number } | { text: string };

export type Project = {
  slug: string;
  title: string;
  kind: string; // e.g. "ASSIGNMENT 2026"
  tags: string[];
  blocks: Block[];
  credits?: string;
  // The live website, if there is one: shows a "visit the website" button
  // under the tags (opens in a new tab).
  link?: string;
  // Desktop only: each paragraph sits next to the image AFTER it instead of
  // the one before it (phones keep the normal order).
  textBesideNext?: boolean;
};

const PLACEHOLDER_CREDITS =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nDonec et elementum turpis. Nulla facilisi.";

const LIST: Project[] = [
  {
    slug: "typeface",
    link: "https://typeface-one.vercel.app/",
    title: "I created an interactive face & body tracking website.",
    kind: "ASSIGNMENT 2026",
    tags: ["frontend coding"],
    blocks: [
      {
        media: [
          {
            src: "/projects/typeface/1.jpg",
            alt: "Woman with glasses using the Glyph Mirror website on her phone",
            ratio: 0.667,
            mw: 254,
          },
        ],
      },
      {
        media: [
          {
            src: "/projects/typeface/2.jpg",
            alt: "Person holding a phone up to the camera showing the Word Body screen",
            ratio: 1.5,
            mw: 402,
          },
        ],
      },
      {
        text: "To experiment with facial and body tracking I created a fun website where your face and body are transformed into typography. This was simply to test my development skills, and to have more content I create out on the internet.",
      },
    ],
  },
  {
    slug: "studio-woensel-west",
    textBesideNext: true,
    title: "I created an art piece for a Van Abbe Museum installation about nostalgia with Studio Woensel West.",
    kind: "PERSONAL PROJECT 2026",
    tags: ["immersive experience design", "clay sculpting"],
    blocks: [
      {
        media: [
          {
            src: "/projects/studio-woensel-west/1.jpg",
            alt: "A visitor looking up past Shoco, a small cracked clay figure on a white shelf",
            ratio: 0.994,
            mw: 277,
          },
        ],
      },
      {
        text: "“Shoco” is a piece I hand-crafted with clay, it shows how objects preserve human presence, causing it’s meaning to shift over time. Even the message behind the piece now can be changed in 10 years if it is found by someone else, and that cycle continues till the object seizes to exist.",
      },
      {
        media: [
          {
            src: "/projects/studio-woensel-west/2.jpg",
            alt: "Two visitors looking at the Studio Woensel West wall of nostalgic photos at the Van Abbe Museum",
            ratio: 1.05,
            mw: 310,
          },
        ],
      },
      {
        text: "I got the opportunity to create this and display it at Van Abbe Museum by joining Studio Woensel West, an organization that helps spotlight young creatives by working on projects together.",
      },
      {
        media: [
          {
            src: "/projects/studio-woensel-west/3.jpg",
            alt: "Coralie presenting at the installation opening while the group applauds",
            ratio: 1.3,
            mw: 269,
          },
        ],
      },
    ],
  },
  {
    slug: "aruba",
    title: "I created an immersive experience to raise awareness about overtourism.",
    kind: "ASSIGNMENT 2026",
    tags: ["immersive experience design", "video & audio editing"],
    blocks: [
      {
        media: [
          {
            src: "/projects/aruba/1.jpg",
            alt: "Gallery wall with a projected grid of twelve archive clips of Aruba",
            ratio: 1.429,
            mw: 382,
          },
        ],
      },
      {
        text: "A reflection of the cultural effects of over tourism, this is the core of this project. As someone that comes from an island that heavily relies on tourism as its main economic pilar it was important for me to share this message to a wider audience.",
      },
      {
        media: [
          {
            src: "/projects/aruba/installation.mp4",
            alt: "The installation video: twelve tiles of footage showing how tourism changed Aruba",
            ratio: 1.78,
            mw: 316,
            type: "video",
          },
        ],
      },
      {
        text: "This was a visual installation I set up at my school, and the video shows the gradual changes tourism has had on the culture and society of Aruba.",
      },
    ],
  },
  {
    slug: "vanderlande",
    title: "I created an interactive trend report application for Vanderlande.",
    kind: "ASSIGNMENT 2025",
    tags: ["UI/UIX design", "frontend development (flutter)"],
    blocks: [
      {
        media: [
          {
            src: "/projects/vanderlande/1.jpg",
            alt: "Man tapping the Robotics chapter of the trend report on a tablet",
            ratio: 1.5,
            mw: 282,
          },
        ],
      },
      {
        media: [
          {
            src: "/projects/vanderlande/2.jpg",
            alt: "Woman reading the Sustainability chapter of the trend report on a tablet",
            ratio: 1.5,
            mw: 282,
          },
        ],
      },
      {
        text: "This visual trend report application was created for Vanderlande to help streamline their annual trend report that they have to share with all their employees.",
      },
    ],
  },
  {
    slug: "proxy",
    title: "I created a t-shirt design for a school club’s introduction week.",
    kind: "PERSONAL PROJECT 2025",
    tags: ["graphic design"],
    blocks: [
      {
        media: [
          {
            src: "/projects/proxy/1.jpg",
            alt: "Roller skater in a skate bowl wearing the white Proxy shirt, back print visible",
            ratio: 0.667,
            mw: 308,
          },
        ],
      },
      {
        gap: 29,
        media: [
          {
            src: "/projects/proxy/2.jpg",
            alt: "Man in the white Proxy shirt with the purple front logo",
            ratio: 0.667,
            mw: 143,
          },
          {
            src: "/projects/proxy/3.jpg",
            alt: "Back of the white shirt with the purple PROXY introweek print",
            ratio: 0.667,
            mw: 143,
          },
        ],
      },
      {
        media: [
          {
            src: "/projects/proxy/4.jpg",
            alt: "Woman in a lift wearing the lime green Proxy shirt",
            ratio: 1.5,
            mw: 402,
          },
        ],
      },
      {
        text: "This shirt design came from a t-shirt designing competition I entered and won. I designed introduction week shirts for Proxy, a student club within Fonty’s Hogeschool.",
      },
    ],
  },
  {
    slug: "toteki",
    title: "I created an e-mail newsletter for an advertising company.",
    kind: "PERSONAL PROJECT 2026",
    tags: ["graphic design"],
    blocks: [
      {
        media: [
          {
            src: "/projects/toteki/1.jpg",
            alt: "Laptop on a desk showing the Be Seen billboard newsletter",
            ratio: 1.5,
            mw: 402,
          },
        ],
      },
      {
        text: "How can clients easily view our billboard availability? This is the question I created a solution for in this project. I created an email news/availability letter for an advertising company.",
      },
      {
        media: [
          {
            src: "/projects/toteki/2.jpg",
            alt: "Woman reading the billboard availability email in Outlook on a laptop",
            ratio: 0.7,
            mw: 258,
          },
        ],
      },
    ],
  },
  {
    slug: "brose",
    link: "https://brose-next.vercel.app/",
    title: "I rebranded rosé, into a drink marketed towards Gen-Z men.",
    kind: "ASSIGNMENT 2026",
    tags: ["UI/UIX design", "frontend development (react)", "advertisement design", "product design"],
    blocks: [
      {
        media: [
          {
            src: "/projects/brose/1.jpg",
            alt: "Red Start the Knight poster pasted on a brick wall",
            ratio: 1.429,
            mw: 402,
          },
        ],
      },
      {
        media: [
          {
            src: "/projects/brose/2.jpg",
            alt: "The King of the World poster at a bus stop",
            ratio: 1.429,
            mw: 260,
          },
        ],
      },
      {
        text: "Brosé is rosé rebranded towards young men. It’s visual style is a combination of modern and medieval elements. I created the visual style along with the branding and products design.",
      },
      {
        media: [
          {
            src: "/models/brose.glb",
            alt: "3D model of the Brosé bottle. Drag to turn it.",
            ratio: 0.9,
            mw: 402,
            type: "model",
          },
        ],
      },
      {
        media: [
          {
            src: "/projects/brose/3.jpg",
            alt: "Man on a blue sofa viewing the Brosé website on his phone",
            ratio: 1.503,
            mw: 201,
          },
          {
            src: "/projects/brose/4.jpg",
            alt: "Man holding up his phone showing the Brosé bottle page",
            ratio: 1.503,
            mw: 201,
          },
        ],
      },
      {
        text: "The website for this brand was created using Next.js, the website was created to spotlight the bottle and inform it’s audience about the ingredients and pairings for this wine, while keeping up with the visual identity of the brand.",
      },
    ],
  },
  {
    slug: "bob-marley",
    title: "I created a tribute website for the artist Bob Marley.",
    kind: "ASSIGNMENT 2024",
    tags: ["UI/UIX design"],
    blocks: [
      {
        media: [
          {
            src: "/projects/bob-marley/1.png",
            alt: "Hands typing on a laptop among plants, the screen showing the Legacy page",
            ratio: 1.5,
            mw: 376,
          },
        ],
      },
      {
        media: [
          {
            src: "/projects/bob-marley/2.jpg",
            alt: "Man in a cap browsing the Stand Up page of the tribute site on a laptop",
            ratio: 1.5,
            mw: 296,
          },
        ],
      },
      {
        text: "This was a personal project where I designed a digital biography of Bob Marley using a mixed media approach. I wanted to reflect his raw energy and cultural impact through a bold, handcrafted visual style.",
      },
    ],
  },
  {
    slug: "loes",
    title: "I created a personalized font for a UI/UX designer.",
    kind: "ASSIGNMENT 2026",
    tags: ["branding", "graphic design"],
    blocks: [
      {
        media: [
          {
            src: "/projects/loes/1.png",
            alt: "Laptop on a pink sofa with Loes Smeets set in the patch font",
            ratio: 0.92,
            mw: 295,
          },
        ],
      },
      {
        media: [
          {
            src: "/projects/loes/2.jpg",
            alt: "The full patch-style alphabet over strands of hair",
            ratio: 1.306,
            mw: 295,
          },
        ],
      },
      {
        text: "“Loes” is a customized font I made for a fellow designer, by graphic designing a patch-style font and making it usable by turning it into an .sbix TT font.",
      },
    ],
  },
  {
    slug: "boroughs",
    title: "I created an application, to make it easier to create and share wishlists.",
    kind: "ASSIGNMENT 2025",
    tags: ["UI/UIX design", "frontend development (flutter)", "advertisement design"],
    blocks: [
      {
        media: [
          {
            src: "/projects/boroughs/1.jpg",
            alt: "Hands holding a phone showing the Lists screen of the Boroughs app",
            ratio: 0.667,
            mw: 268,
          },
        ],
      },
      {
        media: [
          {
            src: "/projects/boroughs/2.jpg",
            alt: "Woman looking at a Boroughs poster on a rusted orange wall",
            ratio: 1.5,
            mw: 308,
          },
        ],
      },
      {
        text: "Boroughs is a visual wishlist app, it’s made for people who love saving things they come across fashion, furniture, ideas but don’t have a clean, inspiring way to keep track of it all.",
      },
      {
        media: [
          {
            src: "/projects/boroughs/3.jpg",
            alt: "Shopping bags, a wallet and a phone showing a Summer wishlist",
            ratio: 0.667,
            mw: 269,
          },
        ],
      },
      {
        text: "I built the frontend interface of this application using flutter, and also created an accompanying promotional video for the application made with stop-motion animation.",
      },
      {
        media: [
          {
            src: "/projects/boroughs/promo.mp4",
            alt: "Stop-motion promotional video for the Boroughs app",
            ratio: 1.778,
            mw: 402,
            type: "video",
          },
        ],
      },
    ],
  },
  {
    slug: "hey-you",
    title: "I created an application, to spread awareness on sharing personal information online.",
    kind: "ASSIGNMENT 2025",
    tags: ["UI/UIX design", "Figma high-fidelity prototyping", "advertisement design"],
    blocks: [
      {
        media: [
          {
            src: "/projects/hey-you/1.jpg",
            alt: "Phone glowing in the dark showing a map of nearby crushes",
            ratio: 1.5,
            mw: 402,
          },
        ],
      },
      {
        media: [
          {
            src: "/projects/hey-you/2.jpg",
            alt: "Finger tapping the pink Hey You splash screen on a phone",
            ratio: 1.5,
            mw: 309,
          },
        ],
      },
      {
        text: "What began as satire idea about stalking your crush became a commentary on privacy and digital footprints. The app lets users add a “crush” and slowly collect publicly available data birthday, location, friends and interests.",
      },
      {
        media: [
          {
            src: "/projects/hey-you/3.jpg",
            alt: "Blurred passer-by in front of a Hey You poster on a graffiti wall",
            ratio: 1.429,
            mw: 402,
          },
        ],
      },
      {
        text: "Visually, it leans into bold colors, playful UI to keep it light, while making the real implications hit deeper the more you explored. I created a poster that’s eyes followed you as you walked by, along with an accompanying high-fidelity Figma prototype of the application.",
      },
    ],
  },
];

export const PROJECTS: Project[] = LIST.map((p) => ({ credits: PLACEHOLDER_CREDITS, ...p }));

export function getProject(slug: string) {
  return PROJECTS.find((p) => p.slug === slug);
}