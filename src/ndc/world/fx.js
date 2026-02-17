import * as THREE from "three";
import { GAME_CONFIG } from "../config.js";

export function createFxSystem(scene, camera) {
  const ringPool = [];
  const ringGeo = new THREE.RingGeometry(0.6, 0.75, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x42e9ff,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  for (let i = 0; i < 32; i += 1) {
    const mesh = new THREE.Mesh(ringGeo, ringMat.clone());
    mesh.visible = false;
    scene.add(mesh);
    ringPool.push({ mesh, life: 0, maxLife: 0.25, isDrone: false });
  }

  const tracerMat = new THREE.LineBasicMaterial({ color: GAME_CONFIG.droneColor, transparent: true, opacity: 0.9 });
  const tracerPool = [];
  for (let i = 0; i < 24; i += 1) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    const line = new THREE.Line(g, tracerMat.clone());
    line.visible = false;
    scene.add(line);
    tracerPool.push({ line, life: 0, maxLife: 0.14 });
  }

  let ringHead = 0;
  let tracerHead = 0;

  function spawnImpact(worldPoint, radius, isDrone = false) {
    const ring = ringPool[ringHead];
    ringHead = (ringHead + 1) % ringPool.length;
    ring.mesh.position.copy(worldPoint);
    ring.mesh.scale.setScalar(Math.max(0.25, radius * 0.38));
    ring.mesh.visible = true;
    ring.life = 0;
    ring.maxLife = 0.25;
    ring.isDrone = isDrone;
    ring.mesh.material.color.set(isDrone ? GAME_CONFIG.droneColor : 0x42e9ff);
    ring.mesh.material.opacity = 0.95;
  }

  function spawnDroneFlash(worldPoint) {
    const t = tracerPool[tracerHead];
    tracerHead = (tracerHead + 1) % tracerPool.length;
    const pos = t.line.geometry.attributes.position.array;
    pos[0] = camera.position.x;
    pos[1] = camera.position.y;
    pos[2] = camera.position.z;
    pos[3] = worldPoint.x;
    pos[4] = worldPoint.y;
    pos[5] = worldPoint.z;
    t.line.geometry.attributes.position.needsUpdate = true;
    t.line.visible = true;
    t.life = 0;
    t.maxLife = 0.12;
    t.line.material.opacity = 0.95;
  }

  function update(dt) {
    for (const r of ringPool) {
      if (!r.mesh.visible) continue;
      r.life += dt;
      const t = r.life / r.maxLife;
      if (t >= 1) {
        r.mesh.visible = false;
      } else {
        r.mesh.quaternion.copy(camera.quaternion);
        r.mesh.scale.multiplyScalar(1 + dt * 6);
        r.mesh.material.opacity = (1 - t) * 0.85;
      }
    }

    for (const t of tracerPool) {
      if (!t.line.visible) continue;
      t.life += dt;
      const p = t.life / t.maxLife;
      if (p >= 1) t.line.visible = false;
      else t.line.material.opacity = 1 - p;
    }
  }

  return {
    spawnImpact,
    spawnDroneFlash,
    update,
    dispose() {
      for (const r of ringPool) {
        scene.remove(r.mesh);
        r.mesh.material.dispose();
      }
      ringGeo.dispose();
      ringMat.dispose();
      for (const t of tracerPool) {
        scene.remove(t.line);
        t.line.geometry.dispose();
        t.line.material.dispose();
      }
      tracerMat.dispose();
    },
  };
}
