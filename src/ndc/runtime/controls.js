import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function createControls(camera, canvas) {
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = true;
  controls.maxPolarAngle = Math.PI * 0.485;
  controls.minDistance = 8;
  controls.maxDistance = 95;
  controls.target.set(0, 6, 0);

  function recenter() {
    controls.target.set(0, 6, 0);
    camera.position.set(26, 22, 26);
    controls.update();
  }

  return { controls, recenter };
}
