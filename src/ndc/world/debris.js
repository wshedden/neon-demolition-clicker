import * as THREE from "three";

export function createDebrisSystem(scene, initialCap) {
  const maxParticles = 600;
  let cap = Math.min(maxParticles, Math.max(1, initialCap));
  const pos = new Float32Array(maxParticles * 3);
  const col = new Float32Array(maxParticles * 3);
  const vel = new Float32Array(maxParticles * 3);
  const life = new Float32Array(maxParticles);
  const active = new Uint8Array(maxParticles);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(col, 3));

  const material = new THREE.PointsMaterial({
    size: 0.19,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let head = 0;

  function spawn(origin, count, tier) {
    for (let i = 0; i < count; i += 1) {
      const idx = head;
      head = (head + 1) % cap;
      active[idx] = 1;
      life[idx] = 0.35 + Math.random() * 0.45;
      pos[idx * 3] = origin.x;
      pos[idx * 3 + 1] = origin.y;
      pos[idx * 3 + 2] = origin.z;
      const spread = 2.2 + tier * 0.07;
      vel[idx * 3] = (Math.random() - 0.5) * spread;
      vel[idx * 3 + 1] = Math.random() * spread;
      vel[idx * 3 + 2] = (Math.random() - 0.5) * spread;
      col[idx * 3] = 0.18 + Math.random() * 0.25;
      col[idx * 3 + 1] = 0.45 + Math.random() * 0.5;
      col[idx * 3 + 2] = 0.88 + Math.random() * 0.12;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  }

  function update(dt) {
    for (let i = 0; i < cap; i += 1) {
      if (!active[i]) continue;
      life[i] -= dt;
      if (life[i] <= 0) {
        active[i] = 0;
        col[i * 3] = 0;
        col[i * 3 + 1] = 0;
        col[i * 3 + 2] = 0;
        continue;
      }
      vel[i * 3 + 1] -= dt * 7;
      pos[i * 3] += vel[i * 3] * dt;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  }

  function countActive() {
    let c = 0;
    for (let i = 0; i < cap; i += 1) c += active[i];
    return c;
  }

  function setCap(nextCap) {
    cap = Math.min(maxParticles, Math.max(1, nextCap));
    head %= cap;
    for (let i = cap; i < maxParticles; i += 1) active[i] = 0;
  }

  return {
    spawn,
    update,
    countActive,
    setCap,
    dispose() {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
    },
  };
}
