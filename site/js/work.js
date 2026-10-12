// Work page (site/work/). The slides are static HTML written by
// scripts/build_project_pages.py and read as a stacked list without JavaScript.
//
// On wide screens with full motion the projects sit round one big cylinder.
// The wheel, a touch drag or the keys turn it directly; when the input stops it
// settles on the nearest project in the direction it was turning, on a heavy,
// critically damped spring, so it feels like a weighted drum rather than a page
// that snaps. The cylinder has no ends: after the last project comes the first.
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
const stageEl = document.querySelector('.work__stage');
const N = slides.length;
const wide = window.matchMedia('(min-width: 769px)');
const wrap = (k) => ((k % N) + N) % N;

const STIFFNESS = 6.5;    // spring frequency (rad/s): lower is heavier
const NUDGE = 0.12;       // a turn smaller than this settles back

let drum = false;
let pos = 0;              // drawn position, in projects (unbounded: it loops)
let vel = 0;
let target = 0;           // where the drum is heading
let raf = 0;
let last = 0;
let active = -1;
let gl = null;            // the WebGL drum, when it is running

function setActive(i) {
  if (i === active) return;
  active = i;
  slides.forEach((slide, j) => {
    slide.classList.toggle('is-active', j === i);
    if (j === i) playClip(slide);
    else slide.querySelector('video')?.pause();
  });
  if (count) count.textContent = String(i + 1).padStart(2, '0');
}

// CSS fallback: each slide is a face of a four-sided drum whose radius is half
// the window height; the shortest way round decides above or below.
function renderCss() {
  const radius = slides[0].offsetHeight / 2;
  slides.forEach((slide, i) => {
    const d = wrap(i - pos + N / 2) - N / 2;
    const near = Math.abs(d) < 1;
    slide.style.transform = near
      ? `translateZ(${-radius}px) rotateX(${-d * 90}deg) translateZ(${radius}px)`
      : 'none';
    slide.style.opacity = near ? String(1 - Math.abs(d) * 0.55) : '0';
    slide.style.pointerEvents = Math.abs(d) < 0.5 ? '' : 'none';
  });
}

function render() {
  setActive(wrap(Math.round(pos)));
  // The links only show while the drum is at rest.
  windowEl.classList.toggle('is-turning', Math.abs(target - pos) > 0.01 || Math.abs(vel) > 0.02);
  if (gl) gl.draw(pos);
  else renderCss();
}

// Critically damped spring towards the target: no overshoot, no hard stop.
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 1 / 60);
  last = now;
  const accel = STIFFNESS * STIFFNESS * (target - pos) - 2 * STIFFNESS * vel;
  vel += accel * dt;
  pos += vel * dt;
  if (Math.abs(target - pos) < 0.0005 && Math.abs(vel) < 0.002) {
    pos = target;
    vel = 0;
    raf = 0;
  } else raf = requestAnimationFrame(tick);
  render();
}

function kick() {
  if (raf || !drum) return;
  last = performance.now();
  raf = requestAnimationFrame(tick);
}

const step = (n) => { target = Math.round(target) + n; kick(); };

// Turn to project i the shortest way round.
function goToIndex(i, instant = false) {
  const here = Math.round(target);
  let delta = i - wrap(here);
  if (delta > N / 2) delta -= N;
  if (delta < -N / 2) delta += N;
  target = here + delta;
  if (instant) { pos = target; vel = 0; render(); } else kick();
}

function fromHash(instant) {
  const i = slides.findIndex((s) => `#${s.id}` === location.hash);
  if (i >= 0) goToIndex(i, instant);
}

// A gesture (wheel burst or touch drag) turns the drum directly; when it ends,
// settle on the next project in the direction it moved, or back if it barely moved.
let gestureBase = null;
let idle = 0;
function turnBy(slidesDelta) {
  if (gestureBase === null) gestureBase = Math.round(target);
  target += slidesDelta;
  kick();
}
function settle() {
  if (gestureBase === null) return;
  const moved = target - gestureBase;
  const n = Math.abs(moved) < NUDGE ? 0 : Math.sign(moved) * Math.max(1, Math.round(Math.abs(moved)));
  target = gestureBase + n;
  gestureBase = null;
  kick();
}

function onWheel(event) {
  if (!drum || event.ctrlKey) return;
  event.preventDefault();
  let d = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  if (event.deltaMode === 1) d *= 16;
  else if (event.deltaMode === 2) d *= window.innerHeight;
  turnBy(d / (window.innerHeight * 0.9));
  clearTimeout(idle);
  idle = setTimeout(settle, 140);
}

let touchY = null;
function onTouchStart(event) {
  if (!drum || event.touches.length !== 1) return;
  touchY = event.touches[0].clientY;
}
function onTouchMove(event) {
  if (touchY === null) return;
  event.preventDefault();
  const y = event.touches[0].clientY;
  turnBy((touchY - y) / (window.innerHeight * 0.6));
  touchY = y;
}
function onTouchEnd() {
  if (touchY === null) return;
  touchY = null;
  settle();
}

function onKey(event) {
  if (!drum || event.altKey || event.ctrlKey || event.metaKey) return;
  const onControl = event.target.closest?.('a, button, input, textarea, select');
  const keys = {
    ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1, ' ': event.shiftKey ? -1 : 1,
  };
  if (event.key === ' ' && onControl) return;
  if (event.key in keys) {
    event.preventDefault();
    step(keys[event.key]);
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    goToIndex(event.key === 'Home' ? 0 : N - 1);
  }
}

function clearCssDrum() {
  slides.forEach((slide) => {
    slide.style.transform = slide.style.opacity = slide.style.pointerEvents = '';
  });
}

function startGL() {
  gl = createDrumGL({
    stageEl,
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

function enable() {
  drum = true;
  root.classList.add('work-drum');
  window.scrollTo(0, 0);
  fromHash(true);
  startGL();
  render();
}

function disable() {
  drum = false;
  root.classList.remove('work-drum');
  cancelAnimationFrame(raf);
  raf = 0;
  gl?.destroy();
  gl = null;
  root.classList.remove('work-gl');
  windowEl.classList.remove('is-turning');
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
      if (!drum && entry.isIntersecting) setActive(slides.indexOf(entry.target));
    });
  }, { threshold: 0.6 });
  slides.forEach((slide) => seen.observe(slide));

  window.addEventListener('wheel', onWheel, { passive: false });
  stageEl.addEventListener('touchstart', onTouchStart, { passive: true });
  stageEl.addEventListener('touchmove', onTouchMove, { passive: false });
  stageEl.addEventListener('touchend', onTouchEnd);
  stageEl.addEventListener('touchcancel', onTouchEnd);
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', () => { if (drum) render(); });
  window.addEventListener('hashchange', () => { if (drum) fromHash(false); });

  // Tabbing into a slide that is not in front turns the drum to it.
  slides.forEach((slide, i) => slide.addEventListener('focusin', () => {
    if (drum && i !== wrap(Math.round(target))) goToIndex(i);
  }));
  nextBtn?.addEventListener('click', () => step(1));

  wide.addEventListener('change', setMode);
  setMode();
}

init();
