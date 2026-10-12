// Gallery. Wide screens with motion: the section pins and the project images fly
// toward the viewer in 3D while the line in the middle reveals word by word.
// Phones, reduced motion and no-JS get a plain grid; every image keeps its demo link.

import { reducedMotion } from './env.js';
import { absolutizeMedia, upgradeTiles, wirePanelLinks } from './showcase.js';

// Where each card sits, as a fraction of the viewport from its centre.
const SLOTS = [
  [-0.3, -0.28], [0.32, -0.3], [-0.38, 0.2], [0.36, 0.14], [-0.04, -0.36],
  [0.1, 0.36], [-0.36, -0.06], [0.4, -0.04], [0.2, -0.36], [-0.22, 0.38],
];
const START_Z = -2600; // the first card starts this deep
const GAP_Z = 380;     // each later card starts this much deeper
const END_Z = 900;     // cards fade out before they reach the camera

function splitWords(line) {
  const words = [];
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = part;
          words.push(span);
          frag.append(span);
        });
        child.replaceWith(frag);
      } else {
        walk(child);
      }
    });
  };
  walk(line);
  return words;
}

export function initGallery({ projects, openPanel }) {
  const section = document.getElementById('gallery');
  if (!section) return;
  absolutizeMedia(section);
  wirePanelLinks(section, openPanel);
  upgradeTiles(section, projects);

  const line = section.querySelector('.gallery__line');
  const cards = [...section.querySelectorAll('.gallery__card')];
  const words = splitWords(line);
  const query = window.matchMedia('(min-width: 900px)');
  const n = cards.length;
  const travel = -START_Z + (n - 1) * GAP_Z + END_Z;

  function update() {
    if (!section.classList.contains('is-flying')) return;
    const r = section.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    cards.forEach((card, i) => {
      const z = START_Z - i * GAP_Z + p * travel;
      const [sx, sy] = SLOTS[i % SLOTS.length];
      const fadeIn = Math.min(1, Math.max(0, (z + 3400) / 1400));
      const fadeOut = Math.min(1, Math.max(0, (END_Z - z) / 500));
      const opacity = fadeIn * fadeOut;
      card.style.transform = `translate3d(${(sx * vw).toFixed(1)}px, ${(sy * vh).toFixed(1)}px, ${z.toFixed(1)}px)`;
      card.style.opacity = opacity.toFixed(3);
      card.style.visibility = opacity < 0.03 ? 'hidden' : 'visible';
      card.classList.toggle('is-near', opacity > 0.4);
    });
    const shown = Math.round(Math.min(1, Math.max(0, (p - 0.12) / 0.45)) * words.length);
    words.forEach((w, i) => w.classList.toggle('is-on', i < shown));
  }

  function setFlying(on) {
    section.classList.toggle('is-flying', on);
    if (on) {
      update();
    } else {
      cards.forEach((c) => { c.style.transform = ''; c.style.opacity = ''; c.style.visibility = ''; });
      words.forEach((w) => w.classList.add('is-on'));
    }
  }

  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }, { passive: true });
  window.addEventListener('resize', update);

  const allowed = () => query.matches && !reducedMotion;
  query.addEventListener('change', () => setFlying(allowed()));
  setFlying(allowed());
}
