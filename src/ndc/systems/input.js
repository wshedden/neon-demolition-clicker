import * as THREE from "three";
import { GAME_CONFIG } from "../config.js";

const _ndc = new THREE.Vector2();
const _centerNdc = new THREE.Vector2(0, 0);
const _launchOrigin = new THREE.Vector3();

export function createInputSystem({ canvas, camera, projectile, holdEnabledRef }) {
  const raycaster = new THREE.Raycaster();
  const pointerDown = { x: 0, y: 0, t: 0, moved: false, leftHeld: false };
  let holdAccumulator = 0;
  let spaceHeld = false;
  let spaceAccumulator = 0;

  function setNdcFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    _ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function launchFromRay(raycasterObj, isDrone = false) {
    _launchOrigin.copy(raycasterObj.ray.origin).addScaledVector(raycasterObj.ray.direction, 1.2);
    projectile.spawn({
      origin: _launchOrigin,
      direction: raycasterObj.ray.direction,
      speed: isDrone ? 44 : 36,
      isDrone,
    });
  }

  function fireFromEvent(e, isDrone = false) {
    setNdcFromEvent(e);
    raycaster.setFromCamera(_ndc, camera);
    launchFromRay(raycaster, isDrone);
    return 0;
  }

  function fireRay(raycasterObj, isDrone = false) {
    launchFromRay(raycasterObj, isDrone);
    return 0;
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
    if (e.button !== 0) return 0;
    const duration = performance.now() - pointerDown.t;
    const dx = e.clientX - pointerDown.x;
    const dy = e.clientY - pointerDown.y;
    const distSq = dx * dx + dy * dy;
    const isClick = !pointerDown.moved && distSq < GAME_CONFIG.clickMoveThreshold ** 2 && duration < GAME_CONFIG.clickTimeThresholdMs;
    pointerDown.leftHeld = false;
    if (isClick) return fireFromEvent(e, false);
    return 0;
  }

  function onKeyDown(e) {
    if (e.code !== "Space") return;
    e.preventDefault();
    if (!spaceHeld) spaceAccumulator = 0;
    spaceHeld = true;
  }

  function onKeyUp(e) {
    if (e.code !== "Space") return;
    e.preventDefault();
    spaceHeld = false;
  }

  function update(dt, lastPointerEvent) {
    if (pointerDown.leftHeld && holdEnabledRef() && !pointerDown.moved && lastPointerEvent) {
      holdAccumulator += dt;
      const fireStep = 1 / GAME_CONFIG.holdShotsPerSecond;
      while (holdAccumulator >= fireStep) {
        holdAccumulator -= fireStep;
        fireFromEvent(lastPointerEvent, false);
      }
    }

    if (spaceHeld) {
      const fireStep = 1 / GAME_CONFIG.holdShotsPerSecond;
      spaceAccumulator += dt;
      while (spaceAccumulator >= fireStep) {
        spaceAccumulator -= fireStep;
        raycaster.setFromCamera(_centerNdc, camera);
        launchFromRay(raycaster, false);
      }
    }

    return 0;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return {
    onPointerUp,
    update,
    fireRay,
    dispose() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
  };
}
