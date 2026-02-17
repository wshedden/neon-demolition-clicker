import { PERF_MODES } from "../config.js";

export function createPerfSystem(initialMode, sceneRuntime, city) {
  let mode = PERF_MODES[initialMode] ? initialMode : "high";

  function apply(nextMode) {
    mode = PERF_MODES[nextMode] ? nextMode : mode;
    sceneRuntime.applyPerfMode(mode);
    city.rebuildForPerf(PERF_MODES[mode]);
  }

  function toggle() {
    apply(mode === "high" ? "low" : "high");
    return mode;
  }

  apply(mode);

  return {
    getMode: () => mode,
    getConfig: () => PERF_MODES[mode],
    apply,
    toggle,
  };
}
