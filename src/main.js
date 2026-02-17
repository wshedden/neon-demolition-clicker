/**
 * Run:
 *   npm install
 *   npm install three
 *   npm run dev
 */

import "./style.css";
import { startNDC } from "./ndc/index.js";

const uiRoot = document.getElementById("uiRoot");
startNDC({ canvasId: "c", uiRoot, gameId: "ndc-smoke-test" });
