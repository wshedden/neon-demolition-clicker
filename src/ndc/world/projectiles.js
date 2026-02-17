import * as THREE from "three";

const _stepDir = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();

export function createProjectileSystem(scene) {
  const projectileCount = 72;
  const gravity = 22;
  const projectileRadius = 0.32;

  const geometry = new THREE.SphereGeometry(projectileRadius, 12, 10);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffb562,
    emissive: 0xff7f22,
    emissiveIntensity: 0.85,
    roughness: 0.28,
    metalness: 0.1,
  });

  const pool = [];
  for (let i = 0; i < projectileCount; i += 1) {
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.visible = false;
    scene.add(mesh);
    pool.push({
      mesh,
      active: false,
      life: 0,
      maxLife: 4,
      pos: new THREE.Vector3(),
      prev: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      isDrone: false,
    });
  }

  const raycaster = new THREE.Raycaster();
  let head = 0;

  function spawn({ origin, direction, speed, isDrone = false }) {
    const p = pool[head];
    head = (head + 1) % pool.length;

    p.active = true;
    p.isDrone = isDrone;
    p.life = 0;
    p.maxLife = isDrone ? 3.4 : 4.4;
    p.pos.copy(origin);
    p.prev.copy(origin);
    p.vel.copy(direction).normalize().multiplyScalar(speed);

    p.mesh.visible = true;
    p.mesh.position.copy(origin);
    p.mesh.material.color.set(isDrone ? 0x68f5ff : 0xffb562);
    p.mesh.material.emissive.set(isDrone ? 0x23a9ff : 0xff7f22);
  }

  function update(dt, { city, upgrades, fx, onReward }) {
    const meshes = city.getDamageableMeshes();
    for (const p of pool) {
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.prev.copy(p.pos);
      p.vel.y -= gravity * dt;
      p.pos.addScaledVector(p.vel, dt);

      const delta = _stepDir.copy(p.pos).sub(p.prev);
      const distance = delta.length();
      if (distance > 0.0001) {
        delta.multiplyScalar(1 / distance);
        _rayOrigin.copy(p.prev).addScaledVector(delta, -projectileRadius * 0.25);
        raycaster.ray.origin.copy(_rayOrigin);
        raycaster.ray.direction.copy(delta);
        raycaster.far = distance + projectileRadius * 0.5;

        const hits = raycaster.intersectObjects(meshes, false);
        if (hits.length) {
          const hit = hits[0];
          const building = hit.object.userData.building;
          if (building && building.aliveCount) {
            const eff = upgrades.effects();
            const reward = building.applyDamageAOE(hit.instanceId ?? 0, hit.point, eff.damage, eff.radius, eff);
            if (reward > 0) {
              fx.spawnImpact(hit.point, eff.radius, p.isDrone);
              if (p.isDrone) fx.spawnDroneFlash(hit.point);
              onReward(reward);
            }
          }
          p.active = false;
          p.mesh.visible = false;
          continue;
        }
      }

      if (p.pos.y <= 0.02) {
        fx.spawnImpact(p.pos, 0.8, p.isDrone);
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.mesh.position.copy(p.pos);
    }
  }

  return {
    spawn,
    update,
    dispose() {
      for (const p of pool) {
        scene.remove(p.mesh);
        p.mesh.material.dispose();
      }
      geometry.dispose();
      material.dispose();
    },
  };
}
