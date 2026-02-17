import { GAME_CONFIG } from "../config.js";

export function createEconomy(startingScrap = 0) {
  let scrap = Number.isFinite(startingScrap) ? startingScrap : 0;
  let smoothing = 0;

  function addScrap(amount) {
    scrap = Math.max(0, scrap + amount);
  }

  function blockReward(tier, scrapMultiplier) {
    const tierScale = Math.min(GAME_CONFIG.tierValueScale ** (tier - 1), GAME_CONFIG.tierValueCap);
    return GAME_CONFIG.baseBlockValue * tierScale * scrapMultiplier;
  }

  function collapseReward(remainingBlocks, tier, scrapMultiplier) {
    const base = blockReward(tier, scrapMultiplier);
    return remainingBlocks * base * 0.65;
  }

  function estimateSps(droneLevel, droneInterval, avgShotReward) {
    if (droneLevel <= 0) return smoothing * 0.65;
    const raw = (1 / droneInterval) * avgShotReward;
    smoothing += (raw - smoothing) * 0.1;
    return smoothing;
  }

  return {
    addScrap,
    getScrap: () => scrap,
    blockReward,
    collapseReward,
    estimateSps,
  };
}
