import { DEFAULT_SAVE, GAME_CONFIG, SAVE_KEY } from "../config.js";

function safeNum(v, fallback = 0) {
  return Number.isFinite(v) ? v : fallback;
}

function sanitize(raw) {
  if (!raw || typeof raw !== "object") return null;
  const upgrades = raw.upgrades || {};
  return {
    scrap: Math.max(0, safeNum(raw.scrap, 0)),
    upgrades: {
      damage: Math.max(0, Math.floor(safeNum(upgrades.damage, 0))),
      radius: Math.max(0, Math.floor(safeNum(upgrades.radius, 0))),
      multiplier: Math.max(0, Math.floor(safeNum(upgrades.multiplier, 0))),
      drone: Math.max(0, Math.floor(safeNum(upgrades.drone, 0))),
      weakness: Math.max(0, Math.floor(safeNum(upgrades.weakness, 0))),
    },
    perfMode: raw.perfMode === "low" ? "low" : "high",
    holdToFire: Boolean(raw.holdToFire),
    lastTimestamp: safeNum(raw.lastTimestamp, Date.now()),
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    const parsed = sanitize(JSON.parse(raw));
    return parsed || { ...DEFAULT_SAVE };
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function computeOfflineDroneGain(saved, upgradesEffects, economy) {
  const now = Date.now();
  const elapsedSec = Math.max(0, (now - saved.lastTimestamp) / 1000);
  const capped = Math.min(elapsedSec, GAME_CONFIG.droneOfflineHoursCap * 3600);
  if (upgradesEffects.droneLevel <= 0) return 0;
  const basePerShot = economy.blockReward(1, upgradesEffects.scrapMultiplier) * 1.8;
  return (capped / upgradesEffects.droneInterval) * basePerShot;
}

export function createAutosave(getState) {
  let timer = 0;
  function saveNow() {
    const state = getState();
    const payload = {
      ...state,
      lastTimestamp: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  }

  function update(dt) {
    timer += dt;
    if (timer >= 10) {
      timer = 0;
      saveNow();
    }
  }

  window.addEventListener("beforeunload", saveNow);

  return {
    update,
    saveNow,
  };
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
}
