import { GAME_CONFIG } from "../config.js";

export function createLoop(update) {
  let running = false;
  let raf = 0;
  let prev = performance.now();

  function tick(now) {
    if (!running) return;
    const dt = Math.min((now - prev) / 1000, GAME_CONFIG.maxDt);
    prev = now;
    update(dt, now / 1000);
    raf = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (running) return;
      running = true;
      prev = performance.now();
      raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
