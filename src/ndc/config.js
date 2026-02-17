export const SAVE_KEY = "ndc_save_v1";

export const PERF_MODES = {
  low: {
    key: "low",
    label: "Low",
    pixelRatio: 1,
    debrisMax: 250,
    collapseBatch: 260,
    targetBlocks: 4200,
    cityGrid: 3,
    spacing: 20,
  },
  high: {
    key: "high",
    label: "High",
    pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
    debrisMax: 600,
    collapseBatch: 520,
    targetBlocks: 12000,
    cityGrid: 4,
    spacing: 18,
  },
};

export const GAME_CONFIG = {
  bg: 0x000000,
  fogColor: 0x05070d,
  fogNear: 45,
  fogFar: 200,
  maxDt: 0.05,
  clickMoveThreshold: 6,
  clickTimeThresholdMs: 250,
  holdShotsPerSecond: 10,
  buildingRespawnDelay: 0.55,
  collapseThreshold: 0.7,
  collapseDuration: [0.8, 1.2],
  baseBlockValue: 0.28,
  tierValueScale: 1.13,
  tierHpScale: 1.075,
  tierValueCap: 9,
  tierHpCap: 6,
  baseBlockHpMin: 1.2,
  baseBlockHpMax: 2.0,
  droneOfflineHoursCap: 4,
  droneColor: 0x4cf9ff,
};

export const UPGRADE_DEFS = {
  damage: { id: "damage", name: "Damage per shot", base: 12, growth: 1.5, desc: "Hit harder." },
  radius: { id: "radius", name: "Blast radius", base: 18, growth: 1.6, desc: "Larger AoE." },
  multiplier: { id: "multiplier", name: "Scrap multiplier", base: 25, growth: 1.62, desc: "More Scrap from blocks." },
  drone: { id: "drone", name: "Auto-drone", base: 60, growth: 1.7, desc: "Automated shots over time." },
  weakness: { id: "weakness", name: "Structural Weakness", base: 40, growth: 1.58, desc: "Extra damage at base floors." },
};

export const DEFAULT_SAVE = {
  scrap: 0,
  upgrades: {
    damage: 0,
    radius: 0,
    multiplier: 0,
    drone: 0,
    weakness: 0,
  },
  perfMode: "high",
  holdToFire: false,
  lastTimestamp: Date.now(),
};
