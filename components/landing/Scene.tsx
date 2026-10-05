"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF, useTexture } from "@react-three/drei";
import { FloatingObject } from "./FloatingObject";
import { CLICK, CLUSTER, LIGHTING, OBJECTS, ORBIT, PHYSICS } from "./objects";
import * as THREE from "three";
import { useWorld } from "./world";

// Start downloading every model as soon as this file loads (client only).
OBJECTS.forEach((o) => {
  if (o.image) useTexture.preload(o.image);
  else if (o.url) useGLTF.preload(o.url);
});

export function Scene() {
  const world = useWorld();
  const viewport = useThree((s) => s.viewport);
  const gl = useThree((s) => s.gl);
  // Lighter shadows on small screens (phones have less graphics power).
  const shadowRes = useThree((s) => (Math.min(s.size.width, s.size.height) < 700 ? 1024 : 2048));

  const clusterSize = Math.min(viewport.width * CLUSTER.width, viewport.height * CLUSTER.height);

  // Quick press = click (opens the object's page). Press and hold = magnet.
  // Let go = magnet off. Hovering only changes the cursor.
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
      // Jump the cursor position straight to where you pressed (no lag).
      const [x, y] = toWorld(e);
      world.pointer.set(x, y);
      world.prevPointer.set(x, y);
      world.pointerVel.set(0, 0);
      world.pointerActive = true;
      world.pressing = true;
      world.pressTime = performance.now();
      world.pressX = e.clientX;
      world.pressY = e.clientY;
      world.pressMoved = false;
      // (world.pressedHref was just set by the object you pressed, if any.)
      el.style.cursor = "";
      el.setPointerCapture(e.pointerId); // keep dragging even if you leave the canvas
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || e.buttons > 0) world.pointerActive = true;
      if (world.pressing && Math.hypot(e.clientX - world.pressX, e.clientY - world.pressY) > CLICK.moveTolerance) {
        world.pressMoved = true;
      }
    };
    const onLeave = () => {
      if (!world.magnet) world.pointerActive = false;
    };
    const onUp = (e: Event) => {
      const quick = performance.now() - world.pressTime < CLICK.maxClickTime * 1000;
      const href = world.pressedHref;
      const wasClick = world.pressing && quick && !world.pressMoved && e.type === "pointerup";
      world.pressing = false;
      world.magnet = false;
      world.pressedHref = null;
      if (!(e instanceof PointerEvent) || e.pointerType !== "mouse") world.pointerActive = false;
      if (wasClick && href && world.navigate) world.navigate(href);
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

    // Holding (or dragging) switches the magnet on; a quick click doesn't.
    if (world.pressing && !world.magnet) {
      const held = (performance.now() - world.pressTime) / 1000;
      if (held > CLICK.holdDelay || world.pressMoved) {
        world.magnet = true;
        world.introDone = true;
      }
    }
    const { width, height } = state.viewport;

    world.portrait = width / height < ORBIT.portraitAspect;
    world.orbitX = world.portrait
      ? Math.min(clusterSize * ORBIT.width, height * ORBIT.portraitReach)
      : Math.min(clusterSize * ORBIT.width, width * ORBIT.maxScreenWidth);
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

      {/* Key light: the floating objects cast soft shadows onto the necklace only. */}
      <directionalLight
        position={[-3, 5, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[shadowRes, shadowRes]}
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


      {OBJECTS.map((o, i) => (
        <FloatingObject key={o.id} config={o} index={i} clusterSize={clusterSize} />
      ))}
    </>
  );
}