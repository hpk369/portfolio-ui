// Info and Contact pages: the same WebGL background as the intro, behind the whole
// page, plus the fade-to-black page transition and a short staggered entrance.

import { initGlow } from './glow.js';
import { initPageTransitions } from './page-transition.js';

initGlow();
initPageTransitions();

// Stagger the entrance in reading order; the CSS does the motion.
document.querySelectorAll('[data-enter]').forEach((el, i) => {
  el.style.setProperty('--enter-delay', `${120 + i * 70}ms`);
});
requestAnimationFrame(() => document.documentElement.classList.add('is-entered'));
