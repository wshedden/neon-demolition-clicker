import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function createOrbitControls(runtime) {
  const controls = new OrbitControls(runtime.camera, runtime.renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  controls.target.set(0, 0.7, 0);
  controls.update();

  controls.minDistance = 2.0;
  controls.maxDistance = 20.0;
  controls.maxPolarAngle = Math.PI * 0.49;

  // Slightly nicer feel
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.85;
  controls.panSpeed = 0.85;

  return controls;
}
