// Section hand-overs, the same move as intro → About, applied to every section:
// - the outgoing section darkens from the bottom up into the page colour as the
//   next one arrives (a shade pinned to its last screen);
// - the incoming section's title, and any [data-words] text, sharpens word by
//   word from faint and blurred to crisp;
// - [data-rise] media lifts and fades in.
// All of it is driven by the scroll position. Reduced motion and no-JS see the
// sections as they are.

import { reducedMotion } from './env.js';
import { splitWords } from './words.js';

const clamp = (v) => Math.min(1, Math.max(0, v));

export function initTransitions() {
  if (reducedMotion) return;

  // The intro has its own hand-over (the reel), and the last section has nothing after it.
  // (GSAP wraps the pinned intro in a spacer, so match sections at any depth.)
  const sections = [...document.querySelectorAll('main section')].filter((s) => s.id !== 'intro');
  const shaded = sections.slice(0, -1).map((section) => {
    const shade = document.createElement('span');
    shade.className = 'section-shade';
    shade.setAttribute('aria-hidden', 'true');
    section.append(shade);
    section.classList.add('has-shade');
    return { section, shade };
  });

  const texts = [...document.querySelectorAll('main .section-title, main [data-words]')].map((el) => {
    const words = splitWords(el);
    el.classList.add('is-split');
    return { el, words, overlap: Math.min(3, words.length) };
  });

  const risers = [...document.querySelectorAll('main [data-rise]')];

  function update() {
    const vh = window.innerHeight;
    shaded.forEach(({ section, shade }) => {
      // 0 while the section reaches the bottom of the screen; 1 once its bottom is 45% up.
      const p = clamp((vh - section.getBoundingClientRect().bottom) / (vh * 0.55));
      shade.style.setProperty('--shade', p.toFixed(3));
    });
    texts.forEach(({ el, words, overlap }) => {
      // From the moment the text enters near the bottom until it is 50% up the screen.
      const p = clamp((vh * 0.95 - el.getBoundingClientRect().top) / (vh * 0.45));
      const front = p * (words.length + overlap);
      words.forEach((w, i) => w.style.setProperty('--on', clamp((front - i) / overlap).toFixed(3)));
    });
    risers.forEach((el) => {
      const g = clamp((vh - el.getBoundingClientRect().top) / (vh * 0.8));
      el.style.setProperty('--in', g.toFixed(3));
    });
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
