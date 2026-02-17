import * as THREE from "three";

export function createSceneRuntime({ canvas }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });

  renderer.setClearColor(0x000000, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 8, 35);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 200);
  camera.position.set(4.2, 3.0, 5.4);

  // Lights
  scene.add(new THREE.AmbientLight(0x88aaff, 0.25));

  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(6, 10, 4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xff55ff, 0.35);
  fill.position.set(-6, 3, -5);
  scene.add(fill);

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({
      color: 0x020208,
      roughness: 1.0,
      metalness: 0.0,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);

  // Faint neon grid
  const grid = new THREE.GridHelper(40, 40, 0x00d5ff, 0xff3df2);
  grid.position.y = 0.001;
  grid.material.opacity = 0.18;
  grid.material.transparent = true;
  scene.add(grid);

  const clock = new THREE.Clock();

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  function dispose() {
    window.removeEventListener("resize", resize);
    renderer.dispose();
  }

  return { renderer, scene, camera, clock, dispose };
}
