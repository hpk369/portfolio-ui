// Entry point: wires the sections together (spec §5).
// The page is fully readable without this file; everything here is enhancement.

import { Dialog } from '../../kit/js/dialog.js';
import { loadProjects, reducedMotion, scroller } from './env.js';
import { initGlow } from './glow.js';
import { initIntro } from './intro.js';
import { initReveal } from './reveal.js';
import { initRail } from './rail.js';
import { initList } from './projects-list.js';
import { createSpiral } from './projects-spiral.js';
import { initPanel } from './panel.js';

const VIEW_KEY = 'hk-projects-view';
const hasGsap = 'gsap' in window && 'ScrollTrigger' in window;
document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';

function initSmoothScroll() {
  if (hasGsap) window.gsap.registerPlugin(window.ScrollTrigger);
  if (reducedMotion || !('Lenis' in window)) return;
  const lenis = new window.Lenis({ autoRaf: !hasGsap });
  scroller.lenis = lenis;
  if (hasGsap) {
    lenis.on('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add((time) => lenis.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
  }
}

function initMenu() {
  const menuEl = document.getElementById('menu');
  const menu = new Dialog(menuEl);
  document.getElementById('menu-open').addEventListener('click', (event) => {
    scroller.stop();
    menu.open({ trigger: event.currentTarget, focus: menuEl.querySelector('.menu__list a') });
  });
  menuEl.addEventListener('close', () => scroller.start());
  menuEl.querySelector('.menu__close').addEventListener('click', () => menu.close());
  return menu;
}

// In-page links go through the same scroller, so Lenis and the pins agree.
function initAnchors(menu) {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented) return;
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    event.preventDefault();
    if (menu.isOpen) menu.close();
    scroller.start();
    scroller.to(target);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

function readView() {
  try { return localStorage.getItem(VIEW_KEY); } catch { return null; }
}

function saveView(view) {
  try { localStorage.setItem(VIEW_KEY, view); } catch { /* storage blocked: not remembered */ }
}

function initProjects(projects, panel) {
  const section = document.getElementById('demos');
  const buttons = [...section.querySelectorAll('.view-toggle button')];
  const spiralButton = buttons.find((b) => b.dataset.view === 'spiral');
  const wideQuery = window.matchMedia('(min-width: 1024px)');
  const spiralAllowed = () => hasGsap && !reducedMotion && wideQuery.matches;

  initList({ projects, openPanel: panel.open });
  const spiral = hasGsap ? createSpiral({ projects, openPanel: panel.open }) : null;
  let view = 'list';

  function setView(next, { remember = false } = {}) {
    if (next === 'spiral' && !spiralAllowed()) next = 'list';
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === next)));
    if (remember) saveView(next);
    if (next === view) return;
    const wasInside = section.getBoundingClientRect().top <= 0;
    if (next === 'spiral') spiral.enable();
    else spiral?.disable();
    view = next;
    window.ScrollTrigger?.refresh();
    if (wasInside) scroller.to(section, { immediate: true });
  }

  function syncAvailability() {
    const allowed = spiralAllowed();
    spiralButton.disabled = !allowed;
    spiralButton.title = allowed ? '' : 'The spiral needs a wider screen with motion turned on';
    if (!allowed && view === 'spiral') setView('list');
  }

  buttons.forEach((b) => b.addEventListener('click', () => setView(b.dataset.view, { remember: true })));
  wideQuery.addEventListener('change', syncAvailability);
  syncAvailability();
  setView(readView() === 'list' ? 'list' : 'spiral');
}

async function start() {
  initSmoothScroll();
  initGlow();
  initIntro();
  initReveal({ hasGsap });
  initRail();
  const menu = initMenu();
  initAnchors(menu);

  let projects;
  try {
    projects = await loadProjects();
  } catch (error) {
    // The static list and project pages still work; only the extras are missing.
    console.warn('Projects data unavailable:', error.message);
    return;
  }
  const panel = initPanel({ projects });
  initProjects(projects, panel);
  panel.openFromUrl();
  document.fonts?.ready.then(() => window.ScrollTrigger?.refresh());
}

start();
