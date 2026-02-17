import * as THREE from "three";
import { createSceneRuntime } from "./runtime/scene.js";
import { createOrbitControls } from "./runtime/controls.js";
import { createLoop } from "./systems/loop.js";

export function startNDC(ctx) {
  const canvas = document.getElementById(ctx.canvasId);
  if (!canvas) throw new Error(`Canvas #${ctx.canvasId} not found`);

  // Tiny UI so you know it’s running
  if (ctx.uiRoot) {
    ctx.uiRoot.innerHTML = `
      <div class="title">Neon Demolition Clicker</div>
      <div class="muted">
        Smoke test: Three.js + OrbitControls<br/>
        Drag to orbit, wheel to zoom, right-drag to pan
      </div>
    `;
  }

  const runtime = createSceneRuntime({ canvas });
  const controls = createOrbitControls(runtime);

  // A simple cube to prove 3D rendering works
  const geom = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x00e5ff),
    emissive: new THREE.Color(0x003344),
    roughness: 0.25,
    metalness: 0.15,
  });

  const cube = new THREE.Mesh(geom, mat);
  cube.position.set(0, 0.6, 0);
  runtime.scene.add(cube);

  // A subtle “neon rim” look: second slightly bigger wire cube
  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(geom),
    new THREE.LineBasicMaterial({ color: 0xff3df2, transparent: true, opacity: 0.65 })
  );
  wire.scale.setScalar(1.01);
  cube.add(wire);

  const loop = createLoop({
    update(dt) {
      // dt is seconds
      cube.rotation.y += dt * 0.8;
      cube.rotation.x += dt * 0.25;

      // make it gently “pulse”
      const t = runtime.clock.getElapsedTime();
      const pulse = 0.85 + 0.15 * Math.sin(t * 2.0);
      wire.material.opacity = 0.45 + 0.25 * pulse;

      controls.update();
    },
    render() {
      runtime.renderer.render(runtime.scene, runtime.camera);
    },
  });

  loop.start();

  // Clean-ish stop hook if you ever need it later
  return {
    stop() {
      loop.stop();
      controls.dispose?.();
      runtime.dispose?.();
      geom.dispose();
      mat.dispose();
      wire.geometry.dispose();
      wire.material.dispose();
    },
  };
}
