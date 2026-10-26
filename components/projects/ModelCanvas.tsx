"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// The 3D part of ModelViewer. The model is centred and sized to fill the box,
// spins slowly, and follows your drag (with a bit of throw when you let go).
// Vertical swipes still scroll the page on phones.

const HEIGHT = 0.8; // how much of the box's height the model fills (0 to 1)
const AUTO_SPIN = 0.35; // radians per second when nobody's touching it
const DRAG_SPEED = 0.012; // how far it turns per pixel dragged

// The finish of the model. These soften the shine so small bumps and flaws
// in the 3D model don't catch harsh reflections.
const FINISH = {
  metalness: 0.7, // 1 = fully metal (the model's own setting), lower = less mirror-like
  roughness: 1.6, // multiplies the model's own roughness: higher = softer, satin shine
  bumps: 0.3, // strength of the fine surface detail (1 = original, 0 = perfectly smooth)
  reflections: 0.9, // how strongly it reflects the soft studio lights around it
};

function Model({ src, onReady }: { src: string; onReady: () => void }) {
  const { scene } = useGLTF(src);
  const spin = useRef<THREE.Group>(null);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;

  // Centre the model and measure it, so any model fits the same way.
  const { model, height } = useMemo(() => {
    const m = scene.clone(true);
    // Apply FINISH to a copy of each material (so the original stays untouched).
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const soften = (mat: THREE.Material) => {
        const c = mat.clone() as THREE.MeshStandardMaterial;
        if ("metalness" in c) c.metalness = FINISH.metalness;
        if ("roughness" in c) c.roughness = FINISH.roughness;
        if (c.normalScale) c.normalScale.setScalar(FINISH.bumps);
        if ("envMapIntensity" in c) c.envMapIntensity = FINISH.reflections;
        return c;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(soften) : soften(mesh.material);
    });
    const box = new THREE.Box3().setFromObject(m);
    const size = box.getSize(new THREE.Vector3());
    m.position.sub(box.getCenter(new THREE.Vector3()));
    return { model: m, height: Math.max(size.y, size.x * 0.8, size.z * 0.8) };
  }, [scene]);

  // What the camera sees at the model's distance, so it fills HEIGHT of the box.
  const visible = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const scale = (visible * HEIGHT) / height;

  useEffect(() => onReady(), [onReady]);

  const motion = useRef({ angle: 0, vel: 0, dragging: false });
  const reduce = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // Drag to turn, with a little momentum, then back to the slow spin.
  useEffect(() => {
    const el = gl.domElement;
    let lastX = 0;
    const s = motion.current;
    const down = (e: PointerEvent) => {
      s.dragging = true;
      lastX = e.clientX;
      s.vel = 0;
    };
    const move = (e: PointerEvent) => {
      if (!s.dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      s.angle += dx * DRAG_SPEED;
      s.vel = dx * DRAG_SPEED * 60; // radians per second
    };
    const up = () => (s.dragging = false);
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const g = spin.current;
    if (!g) return;
    // The throw slows down and blends back into the gentle auto-spin.
    const s = motion.current;
    if (!s.dragging) {
      const auto = reduce ? 0 : AUTO_SPIN;
      s.vel += (auto - s.vel) * (1 - Math.exp(-2 * dt));
      s.angle += s.vel * dt;
    }
    g.rotation.y = s.angle;
  });

  return (
    <group ref={spin}>
      <group scale={scale}>
        <primitive object={model} />
      </group>
    </group>
  );
}

export default function ModelCanvas({ src, onReady }: { src: string; onReady: () => void }) {
  return (
    <div className="absolute inset-0">
    <Canvas
      style={{ touchAction: "pan-y" }}
      camera={{ position: [0, 0, 10], fov: 30 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
      }}
    >
      {/* Soft, even studio light: big soft panels instead of a photo of a
          room, so the reflections are smooth gradients, not busy details. */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[-3, 5, 8]} intensity={0.8} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2} position={[0, 5, 4]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-7, 0, 3]} rotation-y={Math.PI / 2} scale={[4, 10, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[7, 0, 3]} rotation-y={-Math.PI / 2} scale={[4, 10, 1]} />
        <Lightformer form="rect" intensity={0.6} position={[0, 0, 10]} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={0.4} color="#ffd6ea" position={[0, -5, 2]} rotation-x={-Math.PI / 2} scale={[10, 4, 1]} />
        {/* Red/pink lights behind it, so its edges glow in the stage colours. */}
        <Lightformer form="rect" intensity={2.5} color="#ff2d55" position={[-5, 1, -6]} rotation-y={Math.PI / 5} scale={[3, 10, 1]} />
        <Lightformer form="rect" intensity={2} color="#ff56b6" position={[5, 1, -6]} rotation-y={-Math.PI / 5} scale={[3, 10, 1]} />
      </Environment>
      {/* Floating specks of dust drifting through the light. */}
      <Sparkles count={45} scale={[4.5, 5, 3]} size={2.2} speed={0.25} opacity={0.6} color="#ffc2dc" noise={0.6} />
      <Suspense fallback={null}>
        <Model src={src} onReady={onReady} />
      </Suspense>
    </Canvas>
    </div>
  );
}