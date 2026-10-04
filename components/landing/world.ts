import { createContext, useContext } from "react";
import * as THREE from "three";

export type Body = {
  id: string;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  ang: THREE.Vector3; // extra tumble on top of the base rotation
  angVel: THREE.Vector3;
  theta: number; // angle around the orbit
  spin: number; // accumulated self-rotation
  radius: number;
  collR: number; // radius used when bumping into the keychain
  phase: number;
  fixed: boolean;
  placed: boolean;
  wasMagnet: boolean;
  detour: number; // which way it's going round the keychain: 0 none, 1 +x, 2 -x, 3 +y, 4 -y
};

export type BoxCollider = {
  center: THREE.Vector3;
  half: THREE.Vector3;
};

// Shared, mutable state for the motion loop. Kept outside React state so the
// 60fps loop never triggers re-renders.
export type World = {
  pointer: THREE.Vector2; // smoothed cursor position in world units (z = 0 plane)
  prevPointer: THREE.Vector2;
  pointerVel: THREE.Vector2;
  pointerActive: boolean; // cursor is over the page (used by the eyeball)
  magnet: boolean; // true while the mouse button / finger is held down
  introDone: boolean; // set once you first grab, so the opening layout is skipped
  bodies: Body[];
  colliders: BoxCollider[]; // solid boxes (the keychain) nothing can pass through
  orbitX: number; // orbit half-width in world units
  orbitZ: number; // orbit half-depth in world units
  camZ: number; // camera distance, used to keep objects on screen
  tanHalfFov: number;
  aspect: number;
  startTime: number | null;
  reducedMotion: boolean;
};

export function createWorld(): World {
  return {
    pointer: new THREE.Vector2(),
    prevPointer: new THREE.Vector2(),
    pointerVel: new THREE.Vector2(),
    pointerActive: false,
    magnet: false,
    introDone: false,
    bodies: [],
    colliders: [],
    orbitX: 1,
    orbitZ: 1,
    camZ: 10,
    tanHalfFov: Math.tan((15 * Math.PI) / 180),
    aspect: 1,
    startTime: null,
    reducedMotion:
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

export const WorldContext = createContext<World | null>(null);

export function useWorld(): World {
  const world = useContext(WorldContext);
  if (!world) throw new Error("useWorld must be used inside <WorldContext.Provider>");
  // While you edit code, Next keeps the page running and can hold on to an
  // older world object that's missing newer fields. Fill any gaps in.
  const fresh = createWorld();
  const w = world as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(fresh)) {
    if (w[key] === undefined) w[key] = value;
  }
  return world;
}