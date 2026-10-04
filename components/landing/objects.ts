// Layout and behaviour of the landing page.
//
// The page opens with the objects arranged around the keychain like the
// design. After a moment they ease out into a slow, flat tornado around it:
// round the sides, in front of it and behind it.
// Press and hold anywhere to turn the cursor into a magnet that pulls all the
// objects to it; drag to move them around; let go and they float back.
//
// size:   longest side of the model as a fraction of the cluster size.
// rot:    starting tilt in radians, applied x first, then y, then z.
// start:  where it sits when the page opens, [x, y, z] as a fraction of the
//         cluster size (0,0 = centre, + y = up, + z = towards you).
// spin:   how fast the object slowly turns on its own once orbiting (rad / s).
// look:   the object turns to face the cursor (the eyeball).
// wave:   makes the object ripple like paper/fabric (the dollar bill).
// sway:   makes leaves rustle in a gentle breeze (the tree).
// envIntensity: how strongly it reflects the studio environment (1 = normal).
// brightness:   darkens (below 1) or brightens (above 1) the model's own colour.
// metalStudio:  reflect a purpose-made photo studio (light and dark areas), so
//               metal actually reads as metal. See studioEnv.ts.
// directLight:  how much of the hard key light hits it (1 = all, 0 = none, lit
//               only by the soft surroundings).
// metalness / roughness: override the model's finish. Lower metalness and
//               higher roughness = softer, more even light, less mirror-like glare.
//
// orbit.radius: 1 = the standard orbit width, 0.9 = a bit tighter, etc.
// orbit.height: height of its ring, fraction of the cluster size (+ = up).
// orbit.speed:  1 = standard speed. Slightly different speeds make the
//               objects slowly shuffle positions.
// orbit.phase:  where on the ring it heads to first (radians, 0 to 6.28).
// orbit.tilt:   how much its ring is tipped, so it rises and dips as it goes round.

export type Orbit = {
  radius: number;
  height: number;
  speed: number;
  phase: number;
  tilt: number;
};

export type Wave = {
  amplitude: number; // ripple height, fraction of the bill's length
  wavelength: number; // length of one ripple, fraction of the bill's length
  speed: number; // how fast the ripples travel
};

export type Sway = {
  amount: number; // how far the leaves move, fraction of the tree's size
  speed: number; // 1 = normal breeze, 2 = twice as fast
};

// A solid box other objects can't pass through. Measured in fractions of the
// object's own size, from its centre.
export type Collider = {
  center: [number, number, number];
  half: [number, number, number]; // half of the box's width, height, depth
};

export type ObjectConfig = {
  id: string;
  url: string;
  size: number;
  rot: [number, number, number];
  spin?: number;
  look?: boolean;
  wave?: Wave;
  sway?: Sway;
  envIntensity?: number;
  brightness?: number;
  metalness?: number;
  roughness?: number;
  directLight?: number;
  metalStudio?: boolean;
  fixed?: boolean;
  pos?: [number, number, number]; // only for the fixed keychain
  colliders?: Collider[]; // only for the fixed keychain
  start?: [number, number, number];
  orbit?: Orbit;
};

export const OBJECTS: ObjectConfig[] = [
  {
    id: "keychain", url: "/models/keychain.glb", size: 0.86, rot: [0, 0, 0], fixed: true, pos: [0, 0.04, 0],
    // Solid shapes the other objects bump into and have to go around:
    // the name plate, and the tab + ring sticking up from it.
    colliders: [
      { center: [0, -0.142, -0.006], half: [0.5, 0.17, 0.025] },
      { center: [0, 0.155, 0], half: [0.065, 0.155, 0.1] },
    ],
    // Finish: real metal. It reflects its own studio (light above, darker
    // below, soft lights on both sides), so it reads as metal, not white.
    metalStudio: true, // studio lights can be tuned in studioEnv.ts (STUDIO)
    metalness: 1, // fully metal
    roughness: 0.3, // lower = sharper, more mirror-like shine; higher = brushed/satin
    envIntensity: 1.2, // strength of the reflections (overall brightness)
    directLight: 0.6, // share of the hard key light (adds a sparkle highlight)
    brightness: 1, // tint of the metal (lower = darker)
  },
  {
    id: "dollar", url: "/models/dollar.glb", size: 0.32, rot: [1.35, 0.15, 0.2], spin: 0.25,
    wave: { amplitude: 0.06, wavelength: 0.7, speed: 3 },
    start: [0.23, 0.48, -0.25],
    orbit: { radius: 1, height: 0.36, speed: 1, phase: 5.0, tilt: 0.06 },
  },
  {
    id: "raptor", url: "/models/raptor.glb", size: 0.42, rot: [0.25, -1.57, 0.45],
    start: [-0.24, 0.23, -0.2],
    orbit: { radius: 0.95, height: 0.15, speed: 1.05, phase: 3.95, tilt: -0.08 },
  },
  {
    id: "diamond", url: "/models/diamond.glb", size: 0.34, rot: [0.35, 0, 0.15], spin: 0.4,
    start: [0.28, 0.19, -0.2],
    orbit: { radius: 1.05, height: 0.12, speed: 0.95, phase: 6.05, tilt: 0.07 },
  },
  {
    id: "eyeball", url: "/models/eyeball.glb", size: 0.34, rot: [0, 0, 0], spin: 0, look: true,
    start: [-0.33, -0.26, 0.2],
    orbit: { radius: 1, height: -0.28, speed: 1, phase: 2.9, tilt: -0.05 },
  },
  {
    id: "cork", url: "/models/cork.glb", size: 0.25, rot: [0.2, 0.4, -0.6],
    start: [-0.05, -0.24, 0.18],
    orbit: { radius: 0.92, height: -0.05, speed: 1.08, phase: 1.85, tilt: 0.08 },
  },
  {
    id: "tree", url: "/models/tree.glb", size: 0.36, rot: [0, 0.4, -0.7],
    sway: { amount: 0.012, speed: 1 },
    start: [0.24, -0.25, 0.2],
    orbit: { radius: 1.02, height: -0.2, speed: 0.97, phase: 0.8, tilt: -0.06 },
  },
];

// How big the whole cluster is, as a fraction of the screen.
// It uses whichever of the two is smaller, so it always fits.
export const CLUSTER = {
  width: 1.1, // phones: a little wider than the screen
  height: 1.0, // laptops/desktops: the full screen height
};

// Opening: hold the design layout, then ease out into the orbit.
export const INTRO = {
  hold: 2, // seconds the layout stays put after the page loads
  blend: 3.5, // seconds it takes to ease into the orbit
};

// Size of the standard orbit, as a fraction of the cluster size.
export const ORBIT = {
  width: 0.66, // how far left/right objects travel
  depth: 0.55, // how far in front of / behind the keychain they travel
  maxScreenWidth: 0.45, // on narrow screens, never wider than this fraction of the screen
};

// Motion feel. Tweak these to taste.
export const PHYSICS = {
  orbitSpeed: 0.22, // radians / second; 0.22 = one lap in about 28 seconds
  orbitSpring: 2.5, // how quickly objects float back to their orbit after you let go
  orbitDamping: 2.6, // higher = less overshoot on the way back
  bob: 0.03, // gentle up-and-down float, fraction of cluster size

  magnetSpring: 10, // how strongly the cursor pulls while you hold
  magnetDamping: 5.5,
  magnetSpread: 0.2, // how loosely objects cluster round the cursor
  magnetSwirl: 0.6, // how fast they circle the cursor while held
  magnetDepth: 0.35, // how far in front of the keychain they gather

  separation: 6, // keeps objects from passing through each other
  separationGap: 0.85,
  collisionSize: 0.36, // how "fat" objects are when bumping the keychain (fraction of their size)
  slide: 0.985, // 1 = slide freely along the keychain, lower = more grip
  screenMargin: 0.9, // keeps objects on screen: 1 = fully visible, 0.5 = may half poke off the edge

  tumble: 0.5, // how much objects tumble when dragged around fast
  angSpring: 4, // how fast tumbling settles
  angDamping: 3.2,
  maxSpin: 3,

  pointerSmoothing: 12, // lower = objects trail the cursor more softly
};

// Lighting and shadows.
export const LIGHTING = {
  environment: "studio" as const, // drei preset: studio, city, warehouse, apartment, lobby...
  environmentIntensity: 1,
  shadowOpacity: 0.16, // shadow the objects throw onto the lime background
};

// Film grain over the whole page. The image repeats to fill the screen.
export const GRAIN = {
  image: "/textures/overlay.png",
  opacity: 0.45, // 0 = off, 1 = full strength
  blend: "soft-light" as const, // "soft-light" keeps the lime vivid; "normal" = plain dark specks
  tileWidth: 312, // size of one tile in pixels (the image's own size = sharpest)
  tileHeight: 820,
};