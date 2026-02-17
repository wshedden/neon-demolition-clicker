import * as THREE from "three";
import { GAME_CONFIG } from "../config.js";

const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _vPos = new THREE.Vector3();
const _vScale = new THREE.Vector3(1, 1, 1);
const _vZero = new THREE.Vector3(0, 0, 0);
const _c = new THREE.Color();
const _hitLocal = new THREE.Vector3();
const _worldPos = new THREE.Vector3();

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export function createBuilding({ scene, sharedGeometry, baseMaterial, origin, dims, tier, economy, upgrades, debris, onAward }) {
  let width = dims.w;
  let depth = dims.d;
  let height = dims.h;
  let totalBlocks = width * depth * height;
  let maxHp = 1;

  let positions = new Float32Array(totalBlocks * 3);
  let hp = new Float32Array(totalBlocks);
  let alive = new Uint8Array(totalBlocks);

  let mesh = createMesh(totalBlocks);
  scene.add(mesh);

  let deadBlocks = 0;
  let collapsing = false;
  let collapseTimer = 0;
  let collapseTarget = 1;
  let respawnTimer = -1;

  function createMesh(count) {
    const m = new THREE.InstancedMesh(sharedGeometry, baseMaterial.clone(), count);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    m.position.copy(origin);
    return m;
  }

  function setupInstances() {
    deadBlocks = 0;
    collapsing = false;
    collapseTimer = 0;
    respawnTimer = -1;
    maxHp = randRange(GAME_CONFIG.baseBlockHpMin, GAME_CONFIG.baseBlockHpMax) * Math.min(GAME_CONFIG.tierHpScale ** (tier - 1), GAME_CONFIG.tierHpCap);

    const xOff = -(width - 1) * 0.5;
    const zOff = -(depth - 1) * 0.5;
    let i = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        for (let z = 0; z < depth; z += 1) {
          const px = xOff + x;
          const py = y + 0.5;
          const pz = zOff + z;
          positions[i * 3] = px;
          positions[i * 3 + 1] = py;
          positions[i * 3 + 2] = pz;
          hp[i] = maxHp;
          alive[i] = 1;

          _vPos.set(px, py, pz);
          _m4.compose(_vPos, _q, _vScale);
          mesh.setMatrixAt(i, _m4);

          const hue = 0.56 + (y / Math.max(1, height)) * 0.11;
          _c.setHSL(hue, 0.75, 0.55);
          mesh.setColorAt(i, _c);
          i += 1;
        }
      }
    }
    mesh.count = totalBlocks;
    mesh.userData.building = api;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  }

  function removeBlock(index, award = true) {
    if (!alive[index]) return 0;
    alive[index] = 0;
    deadBlocks += 1;

    _vPos.set(positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2]);
    _m4.compose(_vPos, _q, _vZero);
    mesh.setMatrixAt(index, _m4);
    _c.setRGB(0, 0, 0);
    mesh.setColorAt(index, _c);

    _worldPos.copy(_vPos).add(mesh.position);
    debris.spawn(_worldPos, 2 + ((index + tier) % 2), tier);

    if (!award) return 0;
    const reward = economy.blockReward(tier, upgrades.effects().scrapMultiplier);
    onAward(reward);
    return reward;
  }

  function applyDamageAOE(_instanceId, hitPointWorld, damage, radius, effects) {
    mesh.worldToLocal(_hitLocal.copy(hitPointWorld));
    const radiusSq = radius * radius;
    let reward = 0;

    for (let i = 0; i < totalBlocks; i += 1) {
      if (!alive[i]) continue;
      const dx = positions[i * 3] - _hitLocal.x;
      const dy = positions[i * 3 + 1] - _hitLocal.y;
      const dz = positions[i * 3 + 2] - _hitLocal.z;
      if (dx * dx + dy * dy + dz * dz > radiusSq) continue;

      const yFrac = positions[i * 3 + 1] / height;
      hp[i] -= damage * (yFrac < effects.weaknessFraction ? effects.weaknessMultiplier : 1);

      const healthFrac = Math.max(0, hp[i] / maxHp);
      _c.setHSL(0.56 + healthFrac * 0.12, 0.88, 0.22 + healthFrac * 0.36);
      mesh.setColorAt(i, _c);
      if (hp[i] <= 0) reward += removeBlock(i, true);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;

    if (!collapsing && deadBlocks / totalBlocks >= GAME_CONFIG.collapseThreshold) {
      collapsing = true;
      collapseTimer = 0;
      collapseTarget = randRange(GAME_CONFIG.collapseDuration[0], GAME_CONFIG.collapseDuration[1]);
      const remaining = totalBlocks - deadBlocks;
      const bonus = economy.collapseReward(remaining, tier, effects.scrapMultiplier);
      onAward(bonus);
      _worldPos.set(0, Math.max(2, height * 0.35), 0).add(mesh.position);
      debris.spawn(_worldPos, Math.min(70, remaining), tier + 1);
    }

    return reward;
  }

  function collapseStep(batchSize) {
    let removed = 0;
    for (let i = 0; i < totalBlocks && removed < batchSize; i += 1) {
      if (!alive[i]) continue;
      removeBlock(i, false);
      removed += 1;
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  }

  function update(dt, batchSize) {
    if (collapsing) {
      collapseTimer += dt;
      collapseStep(batchSize);
      if (deadBlocks >= totalBlocks || collapseTimer >= collapseTarget) {
        respawnTimer = GAME_CONFIG.buildingRespawnDelay;
        collapsing = false;
      }
    } else if (respawnTimer >= 0) {
      respawnTimer -= dt;
      if (respawnTimer <= 0) {
        tier += 1;
        const growth = Math.min(1 + tier * 0.02, 1.45);
        rebuild(
          Math.min(Math.max(3, Math.floor(width * growth)), 14),
          Math.min(Math.max(3, Math.floor(depth * growth)), 14),
          Math.min(Math.max(4, Math.floor(height * (1 + tier * 0.015))), 22)
        );
      }
    }
  }

  function rebuild(w, d, h) {
    width = w;
    depth = d;
    height = h;
    totalBlocks = width * depth * height;
    positions = new Float32Array(totalBlocks * 3);
    hp = new Float32Array(totalBlocks);
    alive = new Uint8Array(totalBlocks);

    const old = mesh;
    mesh = createMesh(totalBlocks);
    scene.remove(old);
    old.material.dispose();
    scene.add(mesh);
    api.mesh = mesh;
    setupInstances();
  }

  function dispose() {
    scene.remove(mesh);
    mesh.material.dispose();
  }

  const api = {
    mesh,
    get totalBlocks() {
      return totalBlocks;
    },
    get deadBlocks() {
      return deadBlocks;
    },
    get tier() {
      return tier;
    },
    get aliveCount() {
      return totalBlocks - deadBlocks;
    },
    applyDamageAOE,
    update,
    rebuild,
    dispose,
  };

  setupInstances();
  return api;
}
