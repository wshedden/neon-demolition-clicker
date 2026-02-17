import * as THREE from "three";
import { createBuilding } from "./building.js";

export function createCity({ scene, perfConfig, economy, upgrades, debris }) {
  const buildings = [];
  const sharedGeometry = new THREE.BoxGeometry(0.96, 0.96, 0.96);
  const material = new THREE.MeshStandardMaterial({
    color: 0x2ad6ff,
    emissive: 0x0b1f35,
    emissiveIntensity: 0.6,
    roughness: 0.38,
    metalness: 0.15,
    vertexColors: true,
  });

  let totalBlocks = 0;

  function generatePlots(mode) {
    const plots = [];
    const grid = mode.cityGrid;
    const half = (grid - 1) * 0.5;
    for (let x = 0; x < grid; x += 1) {
      for (let z = 0; z < grid; z += 1) {
        plots.push(new THREE.Vector3((x - half) * mode.spacing, 0, (z - half) * mode.spacing));
      }
    }
    return plots;
  }

  function clear() {
    for (const b of buildings) b.dispose();
    buildings.length = 0;
    totalBlocks = 0;
  }

  function rebuildForPerf(mode) {
    clear();
    const plots = generatePlots(mode);
    const per = Math.max(350, Math.floor(mode.targetBlocks / plots.length));

    for (let i = 0; i < plots.length; i += 1) {
      const w = 4 + (i % 4);
      const d = 4 + ((i * 3) % 4);
      const h = Math.max(6, Math.floor(per / (w * d)));
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
