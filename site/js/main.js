// Entry point. Phase 0 only checks that the vendored libraries loaded;
// later phases import intro, reveal, projects and panel modules from here.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function start() {
  const missing = ['gsap', 'ScrollTrigger', 'Lenis'].filter((name) => !(name in window));
  if (missing.length) {
    // The page is fully readable without these; only motion depends on them.
    console.warn(`Motion libraries not loaded: ${missing.join(', ')}`);
    return;
  }
  window.gsap.registerPlugin(window.ScrollTrigger);
  document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';
}

// Module scripts run after deferred classic scripts, so the vendors are ready here.
start();
