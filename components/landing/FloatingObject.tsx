"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import { CLICK, INTRO, ORBIT, PHYSICS as P, type ObjectConfig, type Orbit, type Sway, type Wave } from "./objects";
import { useWorld, type Body, type BoxCollider, type World } from "./world";
import { createStudioEnv } from "./studioEnv";

const tmpTarget = new THREE.Vector3();
const tmpStart = new THREE.Vector3();
const tmpForce = new THREE.Vector3();
const tmpQ = new THREE.Vector3();
const tmpN = new THREE.Vector3();
const STEP = 1 / 120; // motion runs at a steady 120 steps/second, whatever the frame rate

const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const smoothstep = (x: number) => x * x * (3 - 2 * x);

// ---------------------------------------------------------------------------
// Paper/flag ripple. Bends the model in the GPU every frame. Used for the
// dollar bill.

type WaveUniforms = {
  uTime: THREE.IUniform<number>;
  uAmp: THREE.IUniform<number>;
  uK: THREE.IUniform<number>;
  uSpeed: THREE.IUniform<number>;
  uHalfLen: THREE.IUniform<number>;
};

function addWave(mat: THREE.Material, u: WaveUniforms, key: string) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uTime;
uniform float uAmp;
uniform float uK;
uniform float uSpeed;
uniform float uHalfLen;
float waveZ(vec3 p) {
  // Ripples travel along the bill and grow towards its far end.
  float along = clamp((p.x + uHalfLen) / (2.0 * uHalfLen), 0.0, 1.0);
  float edge = 0.3 + 0.7 * along;
  return uAmp * edge * (
    sin(uK * p.x - uSpeed * uTime) +
    0.35 * sin(uK * 1.6 * p.y + uK * 0.5 * p.x - uSpeed * 1.3 * uTime)
  );
}`
      )
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
if (abs(objectNormal.z) > 0.5) {
  float e = uHalfLen * 0.02;
  float dzdx = (waveZ(position + vec3(e, 0.0, 0.0)) - waveZ(position - vec3(e, 0.0, 0.0))) / (2.0 * e);
  float dzdy = (waveZ(position + vec3(0.0, e, 0.0)) - waveZ(position - vec3(0.0, e, 0.0))) / (2.0 * e);
  vec3 wn = normalize(vec3(-dzdx, -dzdy, 1.0));
  objectNormal = objectNormal.z < 0.0 ? -wn : wn;
}`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
transformed.z += waveZ(position);`
      );
  };
  mat.customProgramCacheKey = () => key;
}

function makeWavy(mesh: THREE.Mesh, wave: Wave, u: WaveUniforms) {
  // The bill is a flat box with only a few corners, which can't bend. Split
  // it into lots of small triangles first.
  mesh.geometry.computeBoundingBox();
  const size = mesh.geometry.boundingBox!.getSize(new THREE.Vector3());
  const length = Math.max(size.x, size.y);
  mesh.geometry = new TessellateModifier(length / 60, 10).modify(mesh.geometry);

  u.uAmp.value = wave.amplitude * length;
  u.uK.value = (Math.PI * 2) / (wave.wavelength * length);
  u.uSpeed.value = wave.speed;
  u.uHalfLen.value = size.x / 2;

  // Swap the flat "unlit" material for a lit one so the ripples catch light.
  const src = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshBasicMaterial;
  const mat = new THREE.MeshStandardMaterial({
    map: src.map ?? null,
    side: THREE.DoubleSide,
    roughness: 0.75,
    metalness: 0,
    transparent: src.transparent,
    alphaTest: src.alphaTest,
  });
  addWave(mat, u, "wave");
  mesh.material = mat;

  // Same bend for the shadow, so the shadow ripples too.
  const depth = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: src.alphaTest ? (src.map ?? null) : null,
    alphaTest: src.alphaTest || 0,
  });
  addWave(depth, u, "wave-depth");
  mesh.customDepthMaterial = depth;
}

// ---------------------------------------------------------------------------
// Leaves rustling in a breeze. Moves the leaf vertices in the GPU every frame:
// a slow sway that comes in gusts, plus a quicker flutter. Used for the tree.

type SwayUniforms = {
  uTime: THREE.IUniform<number>;
  uSwayAmp: THREE.IUniform<number>;
  uSwayFreq: THREE.IUniform<number>;
};

const LEAF_MATERIAL = /leaf|leaves|foliage/i;

function addSway(mat: THREE.Material, u: SwayUniforms, key: string) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uTime;
uniform float uSwayAmp;
uniform float uSwayFreq;
vec3 leafSway(vec3 p) {
  float f = uSwayFreq;
  // Gusts: the breeze gets a bit stronger and weaker over time.
  float gust = 0.65 + 0.35 * sin(uTime * 0.45 + p.x * f * 0.15);
  // Slow sideways sway of whole clumps of leaves.
  vec3 sway = vec3(
    sin(uTime * 0.9 + p.z * f * 0.25),
    0.6 * sin(uTime * 0.7 + p.x * f * 0.25),
    0.0
  );
  // Quick small flutter of individual leaves.
  vec3 flutter = 0.35 * vec3(
    sin(uTime * 3.1 + p.x * f + p.y * f * 0.7),
    sin(uTime * 2.7 + p.y * f + p.z * f * 0.6),
    sin(uTime * 3.6 + p.z * f + p.x * f * 0.5)
  );
  return uSwayAmp * gust * (sway + flutter);
}`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
transformed += leafSway(position);`
      );
  };
  mat.customProgramCacheKey = () => key;
}

function makeSwaying(mesh: THREE.Mesh, sway: Sway, u: SwayUniforms) {
  mesh.geometry.computeBoundingBox();
  const size = mesh.geometry.boundingBox!.getSize(new THREE.Vector3());
  const length = Math.max(size.x, size.y, size.z);
  u.uSwayAmp.value = sway.amount * length;
  u.uSwayFreq.value = (Math.PI * 2) / (length * 0.12);

  const src = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
  const mat = src.clone();
  addSway(mat, u, "sway");
  mesh.material = mat;

  // Same movement for the shadow, keeping the leaf cut-outs.
  const depth = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: src.map ?? null,
    alphaTest: src.alphaTest || 0.5,
  });
  addSway(depth, u, "sway-depth");
  mesh.customDepthMaterial = depth;
}

// ---------------------------------------------------------------------------
// Motion

// Where on its ring an object should be for a given orbit angle.
function orbitPoint(out: THREE.Vector3, theta: number, o: Orbit, body: Body, world: World, S: number, t: number, motion: number) {
  // Along the ring's long axis (side to side on desktop, up and down on phones).
  const along = Math.cos(theta) * world.orbitX * o.radius;
  // The object's own lane (its height on desktop, its column on phones).
  const lane = o.height * S * (world.portrait ? ORBIT.portraitLanes : 1) + Math.sin(theta) * o.tilt * S;
  const bob = Math.sin(t * 0.6 + body.phase) * P.bob * S * motion;
  const z = Math.sin(theta) * world.orbitZ * o.radius;
  return world.portrait ? out.set(lane, along + bob, z) : out.set(along, lane + bob, z);
}

// How far left/right and up/down the camera can see at a given depth.
function viewHalf(world: World, z: number) {
  const hh = Math.max(world.camZ - z, 0.1) * world.tanHalfFov;
  return { hw: hh * world.aspect, hh };
}

// Keep a point inside the visible screen area (minus a margin).
function clampToView(v: THREE.Vector3, world: World, margin: number) {
  const { hw, hh } = viewHalf(world, v.z);
  const mx = Math.max(hw - margin, 0);
  const my = Math.max(hh - margin, 0);
  v.x = THREE.MathUtils.clamp(v.x, -mx, mx);
  v.y = THREE.MathUtils.clamp(v.y, -my, my);
}

// If the straight path to the target would go through the keychain, steer
// round it:
//  1. head for the nearest edge of the keychain that is on screen (staying on
//     this side), and stick with that choice so it doesn't dither;
//  2. once past the edge, cross over to the other side;
//  3. then go straight for the target.
function detour(target: THREE.Vector3, body: Body, world: World) {
  for (const box of world.colliders) {
    const c = box.center;
    const hlf = box.half;
    const r = body.collR * 1.15;
    const sp = body.pos.z - c.z;
    const st = target.z - c.z;
    if (sp * st >= 0) continue; // target is on the same side: nothing in the way

    // Where the straight path crosses the keychain's plane.
    const k = sp / (sp - st);
    const cx = body.pos.x + (target.x - body.pos.x) * k;
    const cy = body.pos.y + (target.y - body.pos.y) * k;
    if (Math.abs(cx - c.x) > hlf.x + r || Math.abs(cy - c.y) > hlf.y + r) continue; // path clears it

    // Already beside the keychain? Then just cross over to the other side.
    const outX = Math.abs(body.pos.x - c.x) > hlf.x + r * 0.9;
    const outY = Math.abs(body.pos.y - c.y) > hlf.y + r * 0.9;
    if (outX || outY) {
      target.set(body.pos.x, body.pos.y, c.z + Math.sign(st) * (hlf.z + r * 1.6));
      return;
    }

    // Pick an edge (once), preferring the closest one that is on screen.
    if (body.detour === 0) {
      const { hw, hh } = viewHalf(world, c.z);
      const xFits = hlf.x + r * 1.3 < hw - body.radius * 0.5;
      const yFits = hlf.y + r * 1.3 < hh - body.radius * 0.5;
      const toX = hlf.x + r - Math.abs(cx - c.x);
      const toY = hlf.y + r - Math.abs(cy - c.y);
      const useX = xFits && (!yFits || toX < toY);
      if (useX) body.detour = cx - c.x >= 0 ? 1 : 2;
      else body.detour = cy - c.y >= 0 ? 3 : 4;
    }

    const side = Math.sign(sp) || 1;
    const z = c.z + side * (hlf.z + r);
    if (body.detour === 1) target.set(c.x + hlf.x + r * 1.3, body.pos.y, z);
    else if (body.detour === 2) target.set(c.x - hlf.x - r * 1.3, body.pos.y, z);
    else if (body.detour === 3) target.set(body.pos.x, c.y + hlf.y + r * 1.3, z);
    else target.set(body.pos.x, c.y - hlf.y - r * 1.3, z);
    return;
  }
  body.detour = 0; // nothing in the way any more
}

// Push an object back out of the keychain if it touches it, and stop it
// moving inwards (it slides along the surface instead).
function collide(body: Body, box: BoxCollider) {
  const c = box.center;
  const hlf = box.half;
  const r = body.collR;
  const q = tmpQ.set(
    THREE.MathUtils.clamp(body.pos.x, c.x - hlf.x, c.x + hlf.x),
    THREE.MathUtils.clamp(body.pos.y, c.y - hlf.y, c.y + hlf.y),
    THREE.MathUtils.clamp(body.pos.z, c.z - hlf.z, c.z + hlf.z)
  );
  const n = tmpN.subVectors(body.pos, q);
  const dist = n.length();
  if (dist >= r) return;

  if (dist > 1e-6) {
    n.divideScalar(dist);
    body.pos.copy(q).addScaledVector(n, r);
  } else {
    // Centre is inside the box: leave by the shallowest side.
    const dx = hlf.x - Math.abs(body.pos.x - c.x);
    const dy = hlf.y - Math.abs(body.pos.y - c.y);
    const dz = hlf.z - Math.abs(body.pos.z - c.z);
    n.set(0, 0, 0);
    if (dz <= dx && dz <= dy) {
      n.z = Math.sign(body.pos.z - c.z) || 1;
      body.pos.z = c.z + n.z * (hlf.z + r);
    } else if (dy <= dx) {
      n.y = Math.sign(body.pos.y - c.y) || 1;
      body.pos.y = c.y + n.y * (hlf.y + r);
    } else {
      n.x = Math.sign(body.pos.x - c.x) || 1;
      body.pos.x = c.x + n.x * (hlf.x + r);
    }
  }

  const vn = body.vel.dot(n);
  if (vn < 0) {
    body.vel.addScaledVector(n, -vn);
    body.vel.multiplyScalar(P.slide);
  }
}

// One small motion step for one orbiting object.
// intro: 0 = sitting in the opening layout, 1 = fully orbiting.
function stepBody(
  body: Body,
  config: ObjectConfig,
  index: number,
  world: World,
  h: number,
  t: number,
  S: number,
  motion: number,
  intro: number
) {
  const o = config.orbit!;
  const target = tmpTarget;
  let k: number;
  let c: number;

  if (world.magnet) {
    // Gather loosely around the cursor, slowly circling it.
    const r = P.magnetSpread * S * (0.6 + 0.4 * ((index * 0.618) % 1));
    const a = body.phase + t * P.magnetSwirl;
    target.set(
      world.pointer.x + Math.cos(a) * r,
      world.pointer.y + Math.sin(a) * r * 0.8,
      P.magnetDepth * S + Math.sin(body.phase * 1.7) * r * 0.5
    );
    k = P.magnetSpring;
    c = P.magnetDamping;
  } else {
    // Float round the keychain (starting from the opening layout).
    const advance = o.speed * P.orbitSpeed * h * motion * intro;
    body.theta += advance;
    body.slot += advance;
    // Drift back towards its evenly spaced slot (after being dragged around).
    let gap = body.slot - body.theta;
    gap = Math.atan2(Math.sin(gap), Math.cos(gap)); // shortest way round
    body.theta += gap * (1 - Math.exp(-P.regroup * h));
    orbitPoint(target, body.theta, o, body, world, S, t, motion);
    if (intro < 1 && config.start) {
      const s = config.start;
      tmpStart.set(s[0] * S, s[1] * S + Math.sin(t * 0.6 + body.phase) * P.bob * S * motion, s[2] * S);
      target.lerpVectors(tmpStart, target, intro);
    }
    k = P.orbitSpring;
    c = P.orbitDamping;
  }

  // Never chase a point off screen.
  clampToView(target, world, body.radius * P.screenMargin);
  detour(target, body, world);
  const force = tmpForce.subVectors(target, body.pos).multiplyScalar(k).addScaledVector(body.vel, -c);

  // Keep objects from passing through each other (the keychain is ignored so
  // things can float in front of and behind it). Off during the opening
  // layout so the design arrangement stays exactly as placed.
  if (intro > 0 || world.magnet) {
    for (const other of world.bodies) {
      if (other === body || other.fixed || !other.placed) continue;
      const dx = body.pos.x - other.pos.x;
      const dy = body.pos.y - other.pos.y;
      const dz = body.pos.z - other.pos.z;
      const d = Math.hypot(dx, dy, dz) || 1e-4;
      const minD = (body.radius + other.radius) * P.separationGap;
      if (d < minD) {
        const push = (minD - d) * P.separation * S;
        force.x += (dx / d) * push;
        force.y += (dy / d) * push;
        force.z += (dz / d) * push;
      }
    }
  }

  body.vel.addScaledVector(force, h);
  body.pos.addScaledVector(body.vel, h);

  // The keychain is solid.
  for (const box of world.colliders) collide(body, box);

  // The screen edges are walls too.
  const { hw, hh } = viewHalf(world, body.pos.z);
  const m = body.radius * P.screenMargin;
  const mx = Math.max(hw - m, 0);
  const my = Math.max(hh - m, 0);
  if (body.pos.x > mx) { body.pos.x = mx; body.vel.x = Math.min(body.vel.x, 0); }
  if (body.pos.x < -mx) { body.pos.x = -mx; body.vel.x = Math.max(body.vel.x, 0); }
  if (body.pos.y > my) { body.pos.y = my; body.vel.y = Math.min(body.vel.y, 0); }
  if (body.pos.y < -my) { body.pos.y = -my; body.vel.y = Math.max(body.vel.y, 0); }

  // Tumble a little when dragged around quickly, then settle.
  if (world.magnet) {
    body.angVel.x -= body.vel.y * P.tumble * h;
    body.angVel.y += body.vel.x * P.tumble * h;
  }
  body.angVel.addScaledVector(body.ang, -P.angSpring * h);
  body.angVel.multiplyScalar(Math.exp(-P.angDamping * h));
  body.angVel.clampLength(0, P.maxSpin);
  body.ang.addScaledVector(body.angVel, h);
}

// ---------------------------------------------------------------------------

type Props = {
  config: ObjectConfig;
  index: number;
  clusterSize: number;
};

// A 3D model (.glb) or a flat 2D image (.png cut-out), both float the same way.
export function FloatingObject(props: Props) {
  return props.config.image ? <ImageObject {...props} /> : <ModelObject {...props} />;
}

function ModelObject(props: Props) {
  const { scene } = useGLTF(props.config.url!);
  return <FloatingBody {...props} scene={scene} />;
}

// Turns a cut-out image into a flat card the same shape as the picture.
function ImageObject(props: Props) {
  const texture = useTexture(props.config.image!);
  const scene = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const img = texture.image as { width: number; height: number };
    const aspect = img.width / img.height;
    const w = aspect >= 1 ? 1 : aspect;
    const h = aspect >= 1 ? 1 / aspect : 1;
    // Unlit, so the picture shows its real colours.
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 24, 24), material);
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }, [texture]);
  return <FloatingBody {...props} scene={scene} />;
}

function FloatingBody({ config, index, clusterSize, scene }: Props & { scene: THREE.Object3D }) {
  const world = useWorld();
  const outer = useRef<THREE.Group>(null);
  const look = useRef<THREE.Group>(null);
  const fixed = !!config.fixed || !config.orbit;

  const waveUniforms = useMemo<WaveUniforms>(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0 },
      uK: { value: 1 },
      uSpeed: { value: 1 },
      uHalfLen: { value: 1 },
    }),
    []
  );

  // Objects with metalStudio get their own studio to reflect (see studioEnv.ts).
  const gl = useThree((s) => s.gl);
  const studioEnv = useMemo(() => (config.metalStudio ? createStudioEnv(gl) : null), [gl, config.metalStudio]);

  const swayUniforms = useMemo<SwayUniforms>(
    () => ({
      uTime: { value: 0 },
      uSwayAmp: { value: 0 },
      uSwayFreq: { value: 1 },
    }),
    []
  );

  // Centre the model on its own origin and measure it, so every model can be
  // sized the same way no matter how it was exported.
  const { model, maxDim, dims } = useMemo(() => {
    const m = scene.clone(true);
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      // Shadows only land on the necklace: the floating objects cast them,
      // the necklace catches them. Nothing else shows shadows.
      mesh.castShadow = !fixed;
      mesh.receiveShadow = fixed;
      // Nothing reacts to hover, so skip ray-testing these heavy meshes.
      mesh.raycast = () => {};

      const matName = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material).name;
      if (config.wave) {
        makeWavy(mesh, config.wave, waveUniforms);
      } else if (config.sway && LEAF_MATERIAL.test(matName)) {
        makeSwaying(mesh, config.sway, swayUniforms);
      } else if (
        config.envIntensity !== undefined ||
        config.brightness !== undefined ||
        config.metalness !== undefined ||
        config.roughness !== undefined ||
        config.directLight !== undefined ||
        config.metalStudio
      ) {
        // Per-object exposure: copy the materials first so the change only
        // affects this object.
        const fix = (mat: THREE.Material) => {
          const c = mat.clone() as THREE.MeshStandardMaterial;
          if (config.envIntensity !== undefined && "envMapIntensity" in c) c.envMapIntensity = config.envIntensity;
          if (config.brightness !== undefined && c.color) c.color.multiplyScalar(config.brightness);
          // These scale the model's own metal/roughness texture rather than
          // replacing it, so the surface detail stays visible.
          if (config.metalness !== undefined && "metalness" in c) c.metalness = config.metalness;
          if (config.roughness !== undefined && "roughness" in c) c.roughness = config.roughness;
          if (studioEnv && "envMap" in c) {
            c.envMap = studioEnv;
            // Use the settings above for metal/roughness instead of the
            // model's own maps, so the shine is predictable. Colour and
            // surface-bump textures are kept.
            c.metalnessMap = null;
            c.roughnessMap = null;
          }
          // Turn down the hard key light on this object only, so it's lit
          // mostly by the soft studio surroundings (like it's in light shade).
          if (config.directLight !== undefined) {
            const amount = config.directLight;
            c.onBeforeCompile = (shader) => {
              shader.fragmentShader = shader.fragmentShader.replace(
                "#include <lights_fragment_end>",
                `#include <lights_fragment_end>
reflectedLight.directDiffuse *= ${amount.toFixed(3)};
reflectedLight.directSpecular *= ${amount.toFixed(3)};`
              );
            };
            c.customProgramCacheKey = () => `direct-${amount}`;
          }
          c.needsUpdate = true;
          return c;
        };
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map(fix) : fix(mesh.material);
      }
    });
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    m.position.sub(center);
    return { model: m, maxDim: Math.max(size.x, size.y, size.z), dims: size };
  }, [scene, config.wave, config.envIntensity, config.brightness, config.metalness, config.roughness, config.directLight, config.sway, studioEnv, fixed, waveUniforms, swayUniforms]);

  const baseRotation = useMemo(
    () => new THREE.Euler(config.rot[0], config.rot[1], config.rot[2], "ZYX"),
    [config.rot]
  );

  const body = useMemo<Body>(
    () => ({
      id: config.id,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      ang: new THREE.Vector3(),
      angVel: new THREE.Vector3(),
      theta: config.orbit?.phase ?? 0,
      slot: config.orbit?.phase ?? 0,
      spin: 0,
      radius: 0,
      collR: 0,
      phase: index * 2.39996, // golden angle, spreads things out evenly
      fixed: !!config.fixed || !config.orbit,
      placed: false,
      wasMagnet: false,
      detour: 0,
    }),
    [config, index]
  );

  // Solid boxes for the keychain (positions are filled in every frame).
  const colliders = useMemo<BoxCollider[]>(
    () => (config.colliders ?? []).map(() => ({ center: new THREE.Vector3(), half: new THREE.Vector3() })),
    [config.colliders]
  );

  useEffect(() => {
    world.colliders.push(...colliders);
    return () => {
      world.colliders = world.colliders.filter((b) => !colliders.includes(b));
    };
  }, [world, colliders]);

  // Register with the world so objects can bump into each other.
  useEffect(() => {
    world.bodies.push(body);
    return () => {
      world.bodies = world.bodies.filter((b) => b !== body);
    };
  }, [world, body]);

  useFrame((state, rawDt) => {
    const g = outer.current;
    if (!g) return;
    const dt = Math.min(rawDt, 0.1);
    const t = state.clock.elapsedTime;
    const S = clusterSize;
    const motion = world.reducedMotion ? 0 : 1;
    body.radius = config.size * S * 0.45;
    body.collR = config.size * S * P.collisionSize;
    waveUniforms.uTime.value = t * motion;
    swayUniforms.uTime.value = t * motion * (config.sway?.speed ?? 1);

    if (fixed) {
      const p = config.pos ?? [0, 0, 0];
      body.pos.set(p[0] * S, p[1] * S, p[2] * S);
      body.placed = true;
      const unit = config.size * S;

      // Gentle forward/back swing, hanging from the top of the model (where
      // the necklace chains end), like a pendulum.
      const a = ((dims.y / maxDim) * unit) / 2; // centre to top
      const sw = config.swing;
      const theta = sw ? Math.sin(t * sw.speed * Math.PI * 2) * sw.angle * motion : 0;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const pivotY = body.pos.y + a;
      g.position.set(body.pos.x, pivotY - a * cos, body.pos.z - a * sin);
      g.rotation.set(theta, 0, 0);
      g.scale.setScalar(1);

      // The solid boxes swing along with it.
      config.colliders?.forEach((cl, i) => {
        const ox = cl.center[0] * unit;
        const oy = cl.center[1] * unit - a;
        const oz = cl.center[2] * unit;
        colliders[i].center.set(body.pos.x + ox, pivotY + oy * cos - oz * sin, body.pos.z + oy * sin + oz * cos);
        colliders[i].half.set(cl.half[0] * unit, cl.half[1] * unit, cl.half[2] * unit);
      });
      return;
    }

    // Opening: hold the design layout, then ease into the orbit. Grabbing
    // skips straight to the orbit. With reduced motion, stay in the layout.
    let intro = 1;
    if (world.reducedMotion) intro = 0;
    else if (!world.introDone && world.startTime !== null) {
      intro = smoothstep(THREE.MathUtils.clamp((t - world.startTime - INTRO.hold) / INTRO.blend, 0, 1));
    }

    if (!body.placed) {
      if (config.start) body.pos.set(config.start[0] * S, config.start[1] * S, config.start[2] * S);
      else orbitPoint(body.pos, body.theta, config.orbit!, body, world, S, t, motion);
      body.placed = true;
    }

    // Just let go: carry on orbiting from wherever the object is now, instead
    // of flying back to its old spot on the ring.
    if (body.wasMagnet && !world.magnet) {
      const along = world.portrait ? body.pos.y : body.pos.x;
      body.theta = Math.atan2(body.pos.z / world.orbitZ, along / world.orbitX);
    }
    body.wasMagnet = world.magnet;

    // Split the frame into small equal steps so motion stays smooth even when
    // the frame rate wobbles.
    const n = Math.max(1, Math.ceil(dt / STEP));
    const h = dt / n;
    for (let i = 0; i < n; i++) stepBody(body, config, index, world, h, t, S, motion, intro);
    body.spin += (config.spin ?? 0.15) * dt * motion * intro;

    // Apply to the scene graph.
    g.position.copy(body.pos);
    g.rotation.set(
      body.ang.x + Math.sin(t * 0.4 + body.phase) * 0.06 * motion,
      body.ang.y + body.spin,
      body.ang.z + Math.sin(t * 0.3 + body.phase) * 0.05 * motion
    );

    // One staggered pop-in when the page loads.
    let appear = 1;
    if (!world.reducedMotion && world.startTime !== null) {
      const local = THREE.MathUtils.clamp((t - world.startTime - index * 0.09) / 0.9, 0, 1);
      appear = local === 0 ? 0.0001 : easeOutBack(local);
    }
    g.scale.setScalar(appear);

    // The eyeball keeps an eye on the cursor.
    const l = look.current;
    if (config.look && l) {
      const k = 1 - Math.exp(-5 * dt);
      const depth = S * 0.9 + Math.max(0, -body.pos.z);
      const tx = world.pointerActive ? -Math.atan2(world.pointer.y - body.pos.y, depth) : 0;
      const ty = world.pointerActive ? Math.atan2(world.pointer.x - body.pos.x, depth) : 0;
      l.rotation.x += (THREE.MathUtils.clamp(tx, -0.8, 0.8) - l.rotation.x) * k;
      l.rotation.y += (THREE.MathUtils.clamp(ty, -0.9, 0.9) - l.rotation.y) * k;
    }
  });

  return (
    <group ref={outer}>
      <group ref={look}>
        <group rotation={baseRotation}>
          <group scale={(config.size * clusterSize) / maxDim}>
            <primitive object={model} />
            {config.href && (
              // Invisible box around the object that catches clicks.
              <mesh
                onPointerDown={(e) => {
                  e.stopPropagation();
                  world.pressedHref = config.href ?? null;
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  if (CLICK.hoverCursor && !world.pressing) gl.domElement.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  gl.domElement.style.cursor = "";
                }}
              >
                <boxGeometry args={[dims.x, dims.y, Math.max(dims.z, maxDim * 0.05)]} />
                <meshBasicMaterial colorWrite={false} depthWrite={false} />
              </mesh>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}