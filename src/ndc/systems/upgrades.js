import { UPGRADE_DEFS } from "../config.js";

export function createUpgrades(initial) {
  const levels = {
    damage: initial.damage || 0,
    radius: initial.radius || 0,
    multiplier: initial.multiplier || 0,
    drone: initial.drone || 0,
    weakness: initial.weakness || 0,
  };

  function getCost(id) {
    const def = UPGRADE_DEFS[id];
    if (!def) return Infinity;
    return def.base * def.growth ** levels[id];
  }

  function buy(id, economy) {
    const cost = getCost(id);
    if (economy.getScrap() < cost) return false;
    economy.addScrap(-cost);
    levels[id] += 1;
    return true;
  }

  function effects() {
    const dmg = 0.8 + levels.damage * 0.42;
    const radius = 1.0 + levels.radius * 0.2;
    const mult = 1 + levels.multiplier * 0.2;
    const weakFrac = Math.min(0.15 + levels.weakness * 0.07, 0.78);
    const weakMult = 1 + levels.weakness * 0.32;
    const droneInterval = Math.max(2.0 - levels.drone * 0.18, 0.38);

    return {
      damage: dmg,
      radius,
      scrapMultiplier: mult,
      weaknessFraction: weakFrac,
      weaknessMultiplier: weakMult,
      droneInterval,
      droneLevel: levels.drone,
    };
  }

  function serialize() {
    return { ...levels };
  }

  return {
    levels,
    getCost,
    buy,
    effects,
    serialize,
    defs: UPGRADE_DEFS,
  };
}
