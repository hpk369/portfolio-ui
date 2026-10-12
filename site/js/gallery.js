// Gallery. Wide screens with motion: the section pins and the project images ride
// a vertical spiral around the line in the middle. Scrolling turns the spiral and
// lifts it from the bottom of the screen to the top, while the line reveals word by
// word. Phones, reduced motion and no-JS get a plain grid; every image keeps its
// demo link.

import { reducedMotion } from './env.js';
import { absolutizeMedia, upgradeTiles, wirePanelLinks } from './showcase.js';
import { splitWords } from './words.js';

const MIN_CARDS = 20;      // the 10 projects repeat so the spiral looks full
const STEP_DEG = 52;       // angle between neighbouring cards
const TURNS = 1.25;        // extra turns over the whole scroll
const REVEAL_FROM = 0.06;  // share of the gallery scroll where the line starts lighting up
const REVEAL_TO = 0.82;    // ...and where the last word is fully lit
const WORD_OVERLAP = 2;    // how many words are mid-fade at once
const PITCH = 0.085;       // vertical gap between cards, as a share of the viewport

export function initGallery({ projects, openPanel }) {
  const section = document.getElementById('gallery');
  if (!section) return;
  absolutizeMedia(section);
  wirePanelLinks(section, openPanel);
  upgradeTiles(section, projects);

  const line = section.querySelector('.gallery__line');
  const list = section.querySelector('.gallery__cards');
  const originals = [...list.querySelectorAll('.gallery__card')];
  const words = splitWords(line);
  const query = window.matchMedia('(min-width: 900px)');
  let cards = originals;
  let clones = [];

  // Repeats are decoration: hidden from assistive tech and not focusable.
  function addClones() {
    for (let i = 0; clones.length + originals.length < MIN_CARDS; i++) {
      const copy = originals[i % originals.length].cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.inert = true;
      clones.push(copy);
    }
    list.append(...clones);
    cards = [...originals, ...clones];
  }

  function removeClones() {
    clones.forEach((c) => c.remove());
    clones = [];
    cards = originals;
  }

  function update() {
    if (!section.classList.contains('is-flying')) return;
    const r = section.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const radius = Math.min(vw * 0.34, 520);
    const pitch = vh * PITCH;
    const n = cards.length;
    const margin = vh * 0.4;
    const travel = (n - 1) * pitch + 2 * margin;

    cards.forEach((card, i) => {
      const deg = i * STEP_DEG + p * 360 * TURNS;
      const rad = (deg * Math.PI) / 180;
      const x = radius * Math.sin(rad);
      const z = radius * Math.cos(rad);
      const y = margin + i * pitch - p * travel;
      // Face the viewer on both halves of the ring, edge-on at the sides.
      const face = Math.cos(rad) < 0 ? deg + 180 : deg;
      const depth = (z + radius) / (2 * radius);           // 0 at the back, 1 in front
      const edge = Math.min(1, Math.max(0, (vh * 0.62 - Math.abs(y)) / (vh * 0.18)));
      const opacity = (0.3 + 0.7 * depth) * edge;
      card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${face.toFixed(1)}deg)`;
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = String(Math.round(depth * 100));
      card.style.visibility = opacity < 0.03 ? 'hidden' : 'visible';
      card.classList.toggle('is-near', depth > 0.6 && edge > 0.8);
    });

    // Words light up gradually over most of the scroll, about two at a time:
    // each word fades over two words' worth of scroll, overlapping its neighbour.
    const reveal = Math.min(1, Math.max(0, (p - REVEAL_FROM) / (REVEAL_TO - REVEAL_FROM)));
    const front = reveal * (words.length + WORD_OVERLAP);
    words.forEach((w, i) => {
      const on = Math.min(1, Math.max(0, (front - i) / WORD_OVERLAP));
      w.style.setProperty('--on', on.toFixed(3));
    });
  }

  function setFlying(on) {
    section.classList.toggle('is-flying', on);
    if (on) {
      addClones();
      update();
    } else {
      removeClones();
      cards.forEach((c) => { c.style.cssText = ''; c.classList.remove('is-near'); });
      words.forEach((w) => w.style.removeProperty('--on'));
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
