// Work page (site/work/). The slides are static HTML written by
// scripts/build_project_pages.py and read as a stacked list without JavaScript.
// On wide screens with full motion the slides sit on the faces of a drum inside
// one rounded window: each scroll step turns the drum a quarter turn, so the
// current project tips away at the top while the next one rolls up from below.
// Scroll snapping gives one project per wheel flick, arrow key or Page Down.
// The drum is drawn with WebGL (work-gl.js); without WebGL, CSS 3D draws it.

import { loadProjects, reducedMotion } from './env.js';
import { playClip, upgradeTiles } from './showcase.js';
import { initPageTransitions } from './page-transition.js';
import { createDrumGL } from './work-gl.js';

const root = document.documentElement;
const slides = [...document.querySelectorAll('.work-slide')];
const count = document.querySelector('.work__current');
const nextBtn = document.querySelector('.work__next');
const windowEl = document.querySelector('.work__window');
const last = slides.length - 1;
const wide = window.matchMedia('(min-width: 769px)');
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

let steps = null;
let pos = 0;      // drawn position, in slides
let target = 0;   // position the scroll asks for
let raf = 0;
let active = -1;
let gl = null;    // the WebGL drum, when it is running

function setActive(i) {
  if (i === active) return;
  active = i;
  slides.forEach((slide, j) => {
    slide.classList.toggle('is-active', j === i);
    if (j === i) playClip(slide);
    else slide.querySelector('video')?.pause();
  });
  if (count) count.textContent = String(i + 1).padStart(2, '0');
  if (nextBtn) nextBtn.hidden = i === last;
}

// Each slide is a face of a four-sided drum whose radius is half the window
// height, so the face in front exactly fills the window.
function render() {
  setActive(Math.round(pos));
  if (gl) {
    // The links only show while the drum is at rest.
    windowEl.classList.toggle('is-turning', Math.abs(target - pos) > 0.01 || Math.abs(pos - Math.round(pos)) > 0.01);
    gl.draw(pos);
    return;
  }
  const radius = slides[0].offsetHeight / 2;
  slides.forEach((slide, i) => {
    const d = i - pos;
    const near = Math.abs(d) < 1;
    slide.style.transform = near
      ? `translateZ(${-radius}px) rotateX(${-d * 90}deg) translateZ(${radius}px)`
      : 'none';
    slide.style.opacity = near ? String(1 - Math.abs(d) * 0.55) : '0';
    slide.style.pointerEvents = Math.abs(d) < 0.5 ? '' : 'none';
  });
}

function clearCssDrum() {
  slides.forEach((slide) => {
    slide.style.transform = slide.style.opacity = slide.style.pointerEvents = '';
  });
}

function startGL() {
  gl = createDrumGL({
    windowEl,
    slides,
    // Context lost (GPU reset, too many tabs): carry on with the CSS drum.
    onLost: () => {
      gl = null;
      root.classList.remove('work-gl');
      render();
    },
  });
  if (gl) {
    root.classList.add('work-gl');
    clearCssDrum();
  }
}

// Ease the drum toward the scroll position so wheel steps feel continuous.
function tick() {
  raf = 0;
  pos += (target - pos) * 0.16;
  if (Math.abs(target - pos) < 0.001) pos = target;
  else raf = requestAnimationFrame(tick);
  render();
}

function read() {
  target = clamp(window.scrollY / window.innerHeight, 0, last);
  if (!raf) raf = requestAnimationFrame(tick);
}

const goTo = (i, behavior = 'smooth') => window.scrollTo({ top: clamp(i, 0, last) * window.innerHeight, behavior });

function fromHash() {
  const i = slides.findIndex((s) => `#${s.id}` === location.hash);
  if (i >= 0 && steps) goTo(i, 'instant');
}

function enable() {
  root.classList.add('work-drum');
  steps = document.createElement('div');
  steps.className = 'work__steps';
  steps.setAttribute('aria-hidden', 'true');
  steps.append(...slides.map(() => document.createElement('div')));
  document.body.append(steps);
  fromHash();
  pos = target = clamp(window.scrollY / window.innerHeight, 0, last);
  startGL();
  render();
}

function disable() {
  root.classList.remove('work-drum');
  steps?.remove();
  steps = null;
  cancelAnimationFrame(raf);
  raf = 0;
  gl?.destroy();
  gl = null;
  root.classList.remove('work-gl');
  clearCssDrum();
}

function setMode() {
  if (wide.matches) enable();
  else disable();
}

function init() {
  initPageTransitions();
  loadProjects()
    .then((projects) => upgradeTiles(document.querySelector('.work'), projects))
    .catch((error) => console.warn('Projects data unavailable:', error.message));

  // Reduced motion: the stacked list with posters only, no drum and no clips.
  if (reducedMotion) return;

  // Stacked list (phones): play the clip of the slide that is on screen.
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!steps && entry.isIntersecting) setActive(slides.indexOf(entry.target));
    });
  }, { threshold: 0.6 });
  slides.forEach((slide) => seen.observe(slide));

  window.addEventListener('scroll', () => { if (steps) read(); }, { passive: true });
  window.addEventListener('resize', () => { if (steps) { read(); render(); } });
  window.addEventListener('hashchange', fromHash);

  // Tabbing into a slide that is not in front turns the drum to it.
  slides.forEach((slide, i) => slide.addEventListener('focusin', () => {
    if (steps && i !== Math.round(target)) goTo(i);
  }));
  nextBtn?.addEventListener('click', () => goTo(active + 1));

  // One project per wheel gesture. A small wheel tick would otherwise snap back,
  // and a trackpad's inertia would skip several projects at once.
  let lastWheel = 0;
  let lastStep = 0;
  window.addEventListener('wheel', (event) => {
    if (!steps || event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault();
    const now = performance.now();
    const fresh = now - lastWheel > 200;
    lastWheel = now;
    if (Math.abs(event.deltaY) < 4 || now - lastStep < 500) return;
    if (fresh || now - lastStep > 1200) {
      lastStep = now;
      goTo(Math.round(target) + Math.sign(event.deltaY));
    }
  }, { passive: false });

  wide.addEventListener('change', setMode);
  setMode();
}

init();
