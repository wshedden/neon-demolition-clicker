import * as THREE from "three";
import { DEFAULT_SAVE, PERF_MODES } from "./config.js";
import { createSceneRuntime } from "./runtime/scene.js";
import { createControls } from "./runtime/controls.js";
import { createLoop } from "./systems/loop.js";
import { createEconomy } from "./systems/economy.js";
import { createUpgrades } from "./systems/upgrades.js";
import { createAutosave, computeOfflineDroneGain, loadSave, resetSave as clearSave } from "./systems/save.js";
import { createPerfSystem } from "./systems/perf.js";
import { createInputSystem } from "./systems/input.js";
import { createCity } from "./world/city.js";
import { createDebrisSystem } from "./world/debris.js";
import { createFxSystem } from "./world/fx.js";
import { createProjectileSystem } from "./world/projectiles.js";
import { createUI } from "./ui/ui.js";

const _droneRay = new THREE.Raycaster();
const _tmpV = new THREE.Vector3();

export function startNDC({ canvasId, uiRoot }) {
  const canvas = document.getElementById(canvasId);
  const saved = { ...DEFAULT_SAVE, ...loadSave() };

  const sceneRt = createSceneRuntime(canvas, saved.perfMode);
  const { controls, recenter } = createControls(sceneRt.camera, canvas);

  const upgrades = createUpgrades(saved.upgrades);
  const economy = createEconomy(saved.scrap);
  economy.addScrap(computeOfflineDroneGain(saved, upgrades.effects(), economy));

  const debris = createDebrisSystem(sceneRt.scene, PERF_MODES[saved.perfMode].debrisMax);
  const fx = createFxSystem(sceneRt.scene, sceneRt.camera);
  const projectile = createProjectileSystem(sceneRt.scene);
  const city = createCity({ scene: sceneRt.scene, perfConfig: PERF_MODES[saved.perfMode], economy, upgrades, debris });
  const perf = createPerfSystem(saved.perfMode, sceneRt, city);

  const holdState = { enabled: saved.holdToFire, lastPointerEvent: null };
  const input = createInputSystem({ canvas, camera: sceneRt.camera, projectile, holdEnabledRef: () => holdState.enabled });

  canvas.addEventListener("pointerup", (e) => {
    economy.addScrap(input.onPointerUp(e));
  });
  canvas.addEventListener("pointermove", (e) => {
    holdState.lastPointerEvent = e;
  });

  const ui = createUI(uiRoot, upgrades);
  const autosave = createAutosave(() => ({
    scrap: economy.getScrap(),
    upgrades: upgrades.serialize(),
    perfMode: perf.getMode(),
    holdToFire: holdState.enabled,
  }));

  let droneTimer = 0;

  function droneFire() {
    const b = city.pickRandomBuilding();
    if (!b || !b.aliveCount) return;
    _tmpV.set(b.mesh.position.x + (Math.random() - 0.5) * 2, b.mesh.position.y + 1 + Math.random() * 8, b.mesh.position.z + (Math.random() - 0.5) * 2);
    const origin = sceneRt.camera.position;
    _droneRay.ray.origin.copy(origin);
    _droneRay.ray.direction.copy(_tmpV).sub(origin).normalize();
    economy.addScrap(input.fireRay(_droneRay, true));
  }

  function renderUI() {
    const eff = upgrades.effects();
    const cityStats = city.getStats();
    const sps = economy.estimateSps(eff.droneLevel, eff.droneInterval, economy.blockReward(1, eff.scrapMultiplier) * 2.2);
    ui.render({
      scrap: economy.getScrap(),
      sps,
      damage: eff.damage,
      radius: eff.radius,
      mult: eff.scrapMultiplier,
      perfLabel: perf.getConfig().label,
      blocks: cityStats.totalBlocks,
      debris: debris.countActive(),
      holdToFire: holdState.enabled,
      avgTier: 1 + upgrades.levels.damage * 0.25,
    });
  }

  ui.bind({
    buy: (id) => upgrades.buy(id, economy),
    toggleHold: () => {
      holdState.enabled = !holdState.enabled;
    },
    togglePerf: () => {
      const mode = perf.toggle();
      debris.setCap(PERF_MODES[mode].debrisMax);
    },
    resetSave: () => {
      if (!window.confirm("Delete save and reload?")) return;
      clearSave();
      window.location.reload();
    },
    recenter,
  });

  const loop = createLoop((dt) => {
    controls.update();
    economy.addScrap(input.update(dt, holdState.lastPointerEvent));
    projectile.update(dt, {
      city,
      upgrades,
      fx,
      onReward: (value) => economy.addScrap(value),
    });

    const eff = upgrades.effects();
    if (eff.droneLevel > 0) {
      droneTimer += dt;
      while (droneTimer >= eff.droneInterval) {
        droneTimer -= eff.droneInterval;
        droneFire();
      }
    }

    city.update(dt, perf.getConfig().collapseBatch);
    debris.update(dt);
    fx.update(dt);
    autosave.update(dt);

    renderUI();
    sceneRt.renderer.render(sceneRt.scene, sceneRt.camera);
  });

  loop.start();
}
