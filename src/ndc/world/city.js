import * as THREE from "three";
import { createBuilding } from "./building.js";

export function createCity({ scene, perfConfig, economy, upgrades, debris }) {
  const buildings = [];
  const sharedGeometry = new THREE.BoxGeometry(0.96, 0.96, 0.96);
  const material = new THREE.MeshStandardMaterial({
    color: 0x7cf5ff,
    emissive: 0x11407a,
    emissiveIntensity: 0.95,
    roughness: 0.24,
    metalness: 0.2,
    vertexColors: true,
  });

  let totalBlocks = 0;

  function generatePlots() {
    return [new THREE.Vector3(0, 0, 0)];
  }

  function clear() {
    for (const b of buildings) b.dispose();
    buildings.length = 0;
    totalBlocks = 0;
  }

  function rebuildForPerf(mode) {
    clear();
    const plots = generatePlots();
    const per = Math.max(550, Math.floor(mode.targetBlocks));

    for (let i = 0; i < plots.length; i += 1) {
      const w = 8;
      const d = 8;
      const h = Math.max(12, Math.floor(per / (w * d)));
      const b = createBuilding({
        scene,
        sharedGeometry,
        baseMaterial: material,
        origin: plots[i],
        dims: { w, d, h },
        tier: 1,
        economy,
        upgrades,
        debris,
        onAward: (v) => economy.addScrap(v),
      });
      buildings.push(b);
      totalBlocks += b.totalBlocks;
    }
  }

  function update(dt, collapseBatch) {
    totalBlocks = 0;
    for (const b of buildings) {
      b.update(dt, collapseBatch);
      totalBlocks += b.totalBlocks;
    }
  }

  function pickRandomBuilding() {
    if (!buildings.length) return null;
    return buildings[(Math.random() * buildings.length) | 0];
  }

  function getDamageableMeshes() {
    return buildings.map((b) => b.mesh);
  }

  function getStats() {
    let alive = 0;
    for (const b of buildings) alive += b.aliveCount;
    return { buildings: buildings.length, totalBlocks, aliveBlocks: alive };
  }

  function dispose() {
    clear();
    sharedGeometry.dispose();
    material.dispose();
  }

  return {
    rebuildForPerf,
    update,
    pickRandomBuilding,
    getDamageableMeshes,
    getStats,
    dispose,
  };
}
