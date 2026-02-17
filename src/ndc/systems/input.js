import * as THREE from "three";
import { GAME_CONFIG } from "../config.js";

const _ndc = new THREE.Vector2();

export function createInputSystem({ canvas, camera, city, upgrades, fx, holdEnabledRef }) {
  const raycaster = new THREE.Raycaster();
  const pointerDown = { x: 0, y: 0, t: 0, moved: false, leftHeld: false };
  let holdAccumulator = 0;

  function setNdcFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    _ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function fireFromEvent(e, isDrone = false) {
    setNdcFromEvent(e);
    raycaster.setFromCamera(_ndc, camera);
    return fireRay(raycaster, isDrone);
  }

  function fireRay(raycasterObj, isDrone = false) {
    const meshes = city.getDamageableMeshes();
    const hits = raycasterObj.intersectObjects(meshes, false);
    if (!hits.length) return 0;
    const hit = hits[0];
    const building = hit.object.userData.building;
    if (!building || !building.aliveCount) return 0;
    const eff = upgrades.effects();
    const reward = building.applyDamageAOE(hit.instanceId ?? 0, hit.point, eff.damage, eff.radius, eff);
    if (reward > 0) {
      fx.spawnImpact(hit.point, eff.radius, isDrone);
      if (isDrone) fx.spawnDroneFlash(hit.point);
    }
    return reward;
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    pointerDown.x = e.clientX;
    pointerDown.y = e.clientY;
    pointerDown.t = performance.now();
    pointerDown.moved = false;
    pointerDown.leftHeld = true;
    holdAccumulator = 0;
  }

  function onPointerMove(e) {
    if (!pointerDown.leftHeld) return;
    const dx = e.clientX - pointerDown.x;
    const dy = e.clientY - pointerDown.y;
    if (dx * dx + dy * dy > GAME_CONFIG.clickMoveThreshold ** 2) {
      pointerDown.moved = true;
    }
  }

  function onPointerUp(e) {
    if (e.button !== 0) return;
    const duration = performance.now() - pointerDown.t;
    const dx = e.clientX - pointerDown.x;
    const dy = e.clientY - pointerDown.y;
    const distSq = dx * dx + dy * dy;
    const isClick = !pointerDown.moved && distSq < GAME_CONFIG.clickMoveThreshold ** 2 && duration < GAME_CONFIG.clickTimeThresholdMs;
    pointerDown.leftHeld = false;
    if (isClick) return fireFromEvent(e, false);
    return 0;
  }

  function update(dt, lastPointerEvent) {
    if (!pointerDown.leftHeld || !holdEnabledRef()) return 0;
    if (pointerDown.moved || !lastPointerEvent) return 0;
    holdAccumulator += dt;
    const fireStep = 1 / GAME_CONFIG.holdShotsPerSecond;
    let reward = 0;
    while (holdAccumulator >= fireStep) {
      holdAccumulator -= fireStep;
      reward += fireFromEvent(lastPointerEvent, false);
    }
    return reward;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);

  return {
    onPointerUp,
    update,
    fireRay,
    dispose() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
    },
  };
}
