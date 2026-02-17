# Neon Demolition Clicker (NDC)

A lightweight 3D destruction + incremental prototype built with **Three.js** on **Vite (vanilla JS)**, designed to run smoothly on a modest Ubuntu laptop.

The long-term goal is a “numbers go up” demolition game where you tear down block-built buildings with satisfying click-to-shoot impacts, unlock increasingly absurd demolition tools and automation, and watch a small procedural city evolve through escalating destruction tiers — all while staying performant and cleanly structured.

---

## What this repo is (right now)

At the moment, this is a **smoke test**:
- Three.js renders a simple scene (neon-ish grid + rotating cube)
- OrbitControls are working (orbit / pan / zoom)
- The project structure is already laid out so the real game can be built in tidy modules without turning into a single-file mess

If you can run it and see the cube, you’re good.

---

## Core intentions (design goals)

### 1) Satisfying destruction without heavy physics
I want the feeling of destruction (chunks, cracks, collapse) **without** requiring:
- real-time rigidbody simulations
- mesh fracturing
- big physics engines

The plan is to fake it convincingly:
- Buildings are made of many small blocks
- “Destruction” is removing blocks + a small amount of debris + quick FX
- Collapses are controlled sequences (batch removals) rather than true physics

### 2) Performance-first 3D on a modest laptop
This project prioritises predictable performance over flashy tech.

Key constraints:
- **Instanced rendering** for blocks (no one-Mesh-per-block nonsense)
- Cap total on-screen blocks and debris
- Avoid per-frame allocations
- Simple lighting, minimal draw calls, no expensive postprocessing required

### 3) Numbers-go-up progression with visible scaling
Progression should feel exponential, but also **look** exponential:
- More blocks destroyed per shot (damage, radius)
- Higher-value materials/building tiers
- Automation (drones) increases throughput
- Collapse bonuses + respawning higher-tier buildings

The city should gradually become busier and more lucrative, without becoming unreadable.

### 4) Clean code layout (modular but not overengineered)
The repo is structured to keep modules focused:
- Runtime (scene/camera/controls)
- Systems (loop, input, economy, upgrades, save, perf)
- World (city/buildings/instancing/debris/fx)
- UI (DOM overlay + formatting)

The intent is to keep `src/main.js` tiny and make `src/ndc/index.js` a wiring harness.

---

## Planned MVP gameplay loop (next milestone)

**Neon Demolition Clicker** MVP aims for:

- A small procedural city (6–12 plots)
- Buildings built from instanced blocks, each with HP/value
- Orbit + click-to-shoot, with click-vs-drag discrimination (so orbiting doesn’t spam shots)
- AoE damage (blast radius upgrades matter)
- Debris particles + impact ring FX (capped)
- Currency: Scrap
- Upgrades:
  - Damage per shot
  - Blast radius
  - Scrap multiplier
  - Auto-drone (periodic automated shots)
  - Structural weakness (bottom blocks take extra damage)
  - Performance mode toggle (Low/High)
  - Hold-to-fire toggle
- Building lifecycle:
  - Collapse at ~70% destroyed
  - Bonus payout
  - Respawn higher tier (within performance caps)
- Saving to localStorage + modest offline gain (drone-only, capped)

---

## Setup (from scratch)

### 1) Install dependencies
From the project root:

```bash
npm install
npm install three
