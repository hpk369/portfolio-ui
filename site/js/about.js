// About. As the section scrolls in after the reveal, the lead sharpens word by word
// (each word goes from faint and blurred to crisp) and the red shape behind it rises
// and brightens. Phones get the same effect; reduced motion and no-JS see plain text.

import { reducedMotion } from './env.js';
import { splitWords } from './words.js';

const WORD_OVERLAP = 3;   // how many words are mid-reveal at once

export function initAbout() {
  const section = document.getElementById('about');
  const lead = section?.querySelector('.about__lead');
  const glow = section?.querySelector('.about__glow');
  if (!lead || reducedMotion) return;

  const words = splitWords(lead);
  lead.classList.add('is-split');
  const clamp = (v) => Math.min(1, Math.max(0, v));

  function update() {
    const vh = window.innerHeight;
    // 0 when the lead's top reaches 90% of the screen, 1 when it reaches 40%.
    const p = clamp((vh * 0.9 - lead.getBoundingClientRect().top) / (vh * 0.5));
    const front = p * (words.length + WORD_OVERLAP);
    words.forEach((w, i) => w.style.setProperty('--on', clamp((front - i) / WORD_OVERLAP).toFixed(3)));
    if (glow) {
      const g = clamp((vh - section.getBoundingClientRect().top) / vh);
      glow.style.transform = `translateY(${((1 - g) * 18).toFixed(2)}%)`;
      glow.style.opacity = `calc(var(--glow-opacity) * ${(0.9 * g).toFixed(3)})`;
    }
  }

  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}
