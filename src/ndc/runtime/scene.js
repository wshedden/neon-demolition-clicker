import * as THREE from "three";
import { GAME_CONFIG, PERF_MODES } from "../config.js";

export function createSceneRuntime(canvas, perfMode) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.setClearColor(GAME_CONFIG.bg, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(GAME_CONFIG.bg);
  scene.fog = new THREE.Fog(GAME_CONFIG.fogColor, GAME_CONFIG.fogNear, GAME_CONFIG.fogFar);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
  camera.position.set(26, 22, 26);

  const ambient = new THREE.AmbientLight(0xaac8ff, 0.6);
  const dir = new THREE.DirectionalLight(0xb5f4ff, 1.15);
  dir.position.set(30, 40, 15);
  scene.add(ambient, dir);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 260),
    new THREE.MeshStandardMaterial({ color: 0x060910, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = false;

  const grid = new THREE.GridHelper(260, 72, 0x56f2ff, 0x0f4f70);
  grid.position.y = 0.01;
  grid.material.opacity = 0.36;
  grid.material.transparent = true;

  scene.add(ground, grid);

  function applyPerfMode(modeKey) {
    const mode = PERF_MODES[modeKey] || PERF_MODES.high;
    renderer.setPixelRatio(mode.pixelRatio);
    resize();
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function dispose() {
    ground.geometry.dispose();
    ground.material.dispose();
    grid.geometry.dispose();
    grid.material.dispose();
    renderer.dispose();
  }

  window.addEventListener("resize", resize);
  applyPerfMode(perfMode);

  return {
    renderer,
    scene,
    camera,
    resize,
    applyPerfMode,
    dispose,
  };
}
