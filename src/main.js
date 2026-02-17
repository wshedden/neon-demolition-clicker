import "./style.css";
import { startNDC } from "./ndc/index.js";

startNDC({
  canvasId: "c",
  uiRoot: document.getElementById("uiRoot"),
  gameId: "ndc",
});
