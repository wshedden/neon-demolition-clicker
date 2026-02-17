export function createLoop({ update, render }) {
  let raf = 0;
  let running = false;
  let last = 0;

  function frame(t) {
    if (!running) return;

    const now = t || performance.now();
    const dtMs = last ? (now - last) : 16.67;
    last = now;

    // clamp to avoid huge jumps when tab was inactive
    const dt = Math.min(0.05, Math.max(0, dtMs / 1000));

    update(dt);
    render();

    raf = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    get running() {
      return running;
    },
  };
}
