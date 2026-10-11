// Glow drift (spec §5 F): pause it when the tab is hidden or the intro is off-screen.
// Reduced motion freezes it through the CSS guard in kit/css/base.css.

export function initGlow() {
  const glow = document.querySelector('.glow');
  const intro = document.getElementById('intro');
  if (!glow || !intro) return;
  let onScreen = true;
  const sync = () => glow.classList.toggle('is-paused', !onScreen || document.hidden);
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    sync();
  }).observe(intro);
  document.addEventListener('visibilitychange', sync);
}
