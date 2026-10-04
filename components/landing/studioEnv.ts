import * as THREE from "three";

// A hand-made "photo studio" for metal to reflect. Metal only looks like metal
// when it reflects something with light AND dark areas in it; a plain bright
// surrounding makes it look like white plastic. This one is symmetrical (so
// one side isn't brighter than the other) and has:
//  - a big, very bright soft light above and in front (the shine),
//  - a darker band just below eye level (gives the metal contrast),
//  - two tall bright lights left and right (edges and bevels catch highlights),
//  - a lime floor (picks up the page colour).
//
// The lights are brighter than plain white (high dynamic range), which is what
// makes reflections actually shine instead of looking grey.

export const STUDIO = {
  base: 0.35, // overall brightness of the surroundings
  softbox: 6, // brightness of the big light above/in front (main shine)
  sideLights: 3.5, // brightness of the left/right lights (edge highlights)
  darkBand: 0.6, // how dark the band below eye level is (0 = off, 1 = black)
};

const smooth = (x: number, a: number, b: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

export function createStudioEnv(gl: THREE.WebGLRenderer): THREE.Texture {
  const W = 512;
  const H = 256;
  const data = new Float32Array(W * H * 4);

  for (let row = 0; row < H; row++) {
    const phi = ((row + 0.5) / H - 0.5) * Math.PI; // row 0 = straight down
    const elev = (phi * 180) / Math.PI;
    for (let x = 0; x < W; x++) {
      const theta = ((x + 0.5) / W - 0.5) * Math.PI * 2;
      // Horizontal angle away from "straight towards the camera" (+z).
      const fromFront = Math.abs((Math.atan2(Math.cos(theta), Math.sin(theta)) * 180) / Math.PI);

      // Base: soft grey, lighter upwards.
      let v = STUDIO.base * (0.75 + 0.45 * Math.sin(phi));

      // Big soft light above/in front.
      v += STUDIO.softbox * smooth(elev, -3, 9) * (1 - smooth(elev, 38, 55)) * (1 - smooth(fromFront, 35, 65));

      // Darker band just below eye level in front.
      v *= 1 - STUDIO.darkBand * smooth(elev, -4, -12) * (1 - smooth(elev, -30, -45)) * (1 - smooth(fromFront, 50, 80));

      // Tall lights left and right.
      const side = Math.abs(fromFront - 75);
      v += STUDIO.sideLights * (1 - smooth(side, 6, 16)) * smooth(elev, -15, -5) * (1 - smooth(elev, 45, 60));

      // Lime floor.
      const floor = smooth(elev, -15, -35);
      const i = (row * W + x) * 4;
      data[i] = v * (1 - floor) + v * 0.6 * floor;
      data[i + 1] = v * (1 - floor) + v * 0.9 * floor;
      data[i + 2] = v * (1 - floor) + v * 0.15 * floor;
      data[i + 3] = 1;
    }
  }

  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.FloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  // Pre-blur it for every roughness level, the way three.js needs.
  const pmrem = new THREE.PMREMGenerator(gl);
  const env = pmrem.fromEquirectangular(tex).texture;
  tex.dispose();
  pmrem.dispose();
  return env;
}