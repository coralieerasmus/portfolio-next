"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import { FloatingObject } from "./FloatingObject";
import { CLUSTER, LIGHTING, OBJECTS, ORBIT, PHYSICS } from "./objects";
import * as THREE from "three";
import { useWorld } from "./world";

// Start downloading every model as soon as this file loads (client only).
OBJECTS.forEach((o) => useGLTF.preload(o.url));

export function Scene() {
  const world = useWorld();
  const viewport = useThree((s) => s.viewport);
  const gl = useThree((s) => s.gl);

  const clusterSize = Math.min(viewport.width * CLUSTER.width, viewport.height * CLUSTER.height);

  // Press and hold = magnet on. Let go = magnet off. Hovering does nothing.
  useEffect(() => {
    const el = gl.domElement;

    const toWorld = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
      return [(nx * viewport.width) / 2, (ny * viewport.height) / 2] as const;
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      // Jump the magnet straight to where you pressed (no smoothing lag).
      const [x, y] = toWorld(e);
      world.pointer.set(x, y);
      world.prevPointer.set(x, y);
      world.pointerVel.set(0, 0);
      world.magnet = true;
      world.introDone = true;
      world.pointerActive = true;
      el.setPointerCapture(e.pointerId); // keep dragging even if you leave the canvas
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || e.buttons > 0) world.pointerActive = true;
    };
    const onLeave = () => {
      if (!world.magnet) world.pointerActive = false;
    };
    const onUp = (e: Event) => {
      world.magnet = false;
      if (!(e instanceof PointerEvent) || e.pointerType !== "mouse") world.pointerActive = false;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onUp);
    };
  }, [gl, world, viewport.width, viewport.height]);

  // Runs before the objects each frame: orbit size, plus a smoothed cursor
  // position and speed in world units.
  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    if (world.startTime === null) world.startTime = state.clock.elapsedTime;
    const { width, height } = state.viewport;

    world.orbitX = Math.min(clusterSize * ORBIT.width, width * ORBIT.maxScreenWidth);
    world.orbitZ = clusterSize * ORBIT.depth;

    // What the camera can see, so objects can be kept on screen.
    const cam = state.camera as THREE.PerspectiveCamera;
    world.camZ = cam.position.z;
    world.tanHalfFov = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    world.aspect = state.size.width / Math.max(state.size.height, 1);

    const tx = (state.pointer.x * width) / 2;
    const ty = (state.pointer.y * height) / 2;
    const k = 1 - Math.exp(-PHYSICS.pointerSmoothing * dt);
    world.prevPointer.copy(world.pointer);
    world.pointer.x += (tx - world.pointer.x) * k;
    world.pointer.y += (ty - world.pointer.y) * k;
    const vx = (world.pointer.x - world.prevPointer.x) / Math.max(dt, 1e-3);
    const vy = (world.pointer.y - world.prevPointer.y) / Math.max(dt, 1e-3);
    const kv = 1 - Math.exp(-8 * dt);
    world.pointerVel.x += (vx - world.pointerVel.x) * kv;
    world.pointerVel.y += (vy - world.pointerVel.y) * kv;
  }, -1);

  return (
    <>
      <ambientLight intensity={0.25} />

      {/* Key light: casts the shadows onto the keychain and the background. */}
      <directionalLight
        position={[-3, 5, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={6}
      >
        <orthographicCamera attach="shadow-camera" args={[-7, 7, 7, -7, 0.1, 30]} />
      </directionalLight>

      {/* Studio HDRI for reflections, plus soft panels placed symmetrically
          (left = right) and a big soft front panel, so shiny surfaces are lit
          evenly. A lime bounce from below picks up the page colour. */}
      <Environment preset={LIGHTING.environment} environmentIntensity={LIGHTING.environmentIntensity}>
        <Lightformer form="rect" intensity={1.5} position={[0, 0, 10]} scale={[14, 8, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[0, 5, 4]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1} position={[-7, 0, 3]} rotation-y={Math.PI / 2} scale={[6, 5, 1]} />
        <Lightformer form="rect" intensity={1} position={[7, 0, 3]} rotation-y={-Math.PI / 2} scale={[6, 5, 1]} />
        <Lightformer form="rect" intensity={1} color="#d1fb53" position={[0, -5, 2]} rotation-x={-Math.PI / 2} scale={[12, 6, 1]} />
      </Environment>

      {/* Invisible backdrop that only shows the shadows, so objects feel like
          they float just above the page. */}
      <mesh position={[0, 0, -0.8 * clusterSize]} receiveShadow>
        <planeGeometry args={[viewport.width * 3, viewport.height * 3]} />
        <shadowMaterial transparent opacity={LIGHTING.shadowOpacity} color="#3d5200" />
      </mesh>

      {OBJECTS.map((o, i) => (
        <FloatingObject key={o.id} config={o} index={i} clusterSize={clusterSize} />
      ))}
    </>
  );
}