import { formatNumber } from "./format.js";

export function createUI(root, upgrades) {
  root.innerHTML = "";

  const hud = document.createElement("div");
  hud.className = "ndc-hud";
  hud.innerHTML = `
    <h1>Neon Demolition Clicker</h1>
    <div id="hudScrap"></div>
    <div id="hudSps"></div>
    <div id="hudTool"></div>
    <small class="muted" id="hudControls"></small>
    <small class="muted" id="hudPerf"></small>
  `;

  const panel = document.createElement("div");
  panel.className = "ndc-panel";
  panel.innerHTML = "<h2>Upgrades</h2>";

  const upgradeEls = {};
  for (const [id, def] of Object.entries(upgrades.defs)) {
    const el = document.createElement("div");
    el.className = "upgrade-item";
    el.innerHTML = `
      <div class="upgrade-row">
        <strong>${def.name}</strong>
        <span data-level></span>
      </div>
      <p>${def.desc}</p>
      <div class="upgrade-row">
        <span data-cost></span>
        <button data-buy="${id}">Buy</button>
      </div>
    `;
    panel.appendChild(el);
    upgradeEls[id] = el;
  }

  const toggles = document.createElement("div");
  toggles.innerHTML = `
    <div class="toggle-row"><span>Hold-to-fire</span><button id="toggleHold"></button></div>
    <div class="toggle-row"><span>Performance Mode</span><button id="togglePerf"></button></div>
  `;
  panel.appendChild(toggles);

  const bottom = document.createElement("div");
  bottom.className = "ndc-bottom";
  bottom.innerHTML = `
    <div class="bottom-left">
      <button id="btnReset">Reset Save</button>
      <button id="btnRecenter">Recenter Camera</button>
    </div>
    <div class="bottom-right"><small id="statusLine"></small></div>
  `;

  root.append(hud, panel, bottom);

  function render(state) {
    hud.querySelector("#hudScrap").textContent = `Scrap: ${formatNumber(state.scrap)}`;
    hud.querySelector("#hudSps").textContent = `Scrap/sec est: ${formatNumber(state.sps)}`;
    hud.querySelector("#hudTool").textContent = `Damage ${state.damage.toFixed(2)} | Radius ${state.radius.toFixed(2)} | x${state.mult.toFixed(2)}`;
    hud.querySelector("#hudControls").textContent = "Shoot: Hold [Space] (or click).";
    hud.querySelector("#hudPerf").textContent = `Perf: ${state.perfLabel} | Blocks: ${state.blocks} | Debris: ${state.debris}`;

    for (const [id, el] of Object.entries(upgradeEls)) {
      const lvl = upgrades.levels[id];
      const cost = upgrades.getCost(id);
      el.querySelector("[data-level]").textContent = `Lv ${lvl}`;
      el.querySelector("[data-cost]").textContent = `Cost ${formatNumber(cost)}`;
      const btn = el.querySelector("[data-buy]");
      btn.disabled = state.scrap < cost;
    }

    panel.querySelector("#toggleHold").textContent = state.holdToFire ? "On" : "Off";
    panel.querySelector("#togglePerf").textContent = state.perfLabel;
    bottom.querySelector("#statusLine").textContent = `City tier avg: ${state.avgTier.toFixed(1)}`;
  }

  return {
    render,
    bind(actions) {
      panel.querySelectorAll("[data-buy]").forEach((btn) => {
        btn.addEventListener("click", () => actions.buy(btn.getAttribute("data-buy")));
      });
      panel.querySelector("#toggleHold").addEventListener("click", actions.toggleHold);
      panel.querySelector("#togglePerf").addEventListener("click", actions.togglePerf);
      bottom.querySelector("#btnReset").addEventListener("click", actions.resetSave);
      bottom.querySelector("#btnRecenter").addEventListener("click", actions.recenter);
    },
  };
}
