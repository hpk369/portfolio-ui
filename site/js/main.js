// Entry point: wires the sections together (spec §5).
// The page is fully readable without this file; everything here is enhancement.

import { Dialog } from '../../kit/js/dialog.js';
import { loadProjects, reducedMotion, scroller } from './env.js';
import { initGlow } from './glow.js';
import { initIntro } from './intro.js';
import { initReveal } from './reveal.js';
import { initRail } from './rail.js';
import { initScrollReveal } from './scroll-reveal.js';
import { initShowcase } from './showcase.js';
import { initGallery } from './gallery.js';
import { initPanel } from './panel.js';

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

async function start() {
  initSmoothScroll();
  initGlow();
  initIntro();
  initReveal({ hasGsap });
  initRail();
  initScrollReveal();
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
  initShowcase({ projects, openPanel: panel.open });
  initGallery({ projects, openPanel: panel.open });
  panel.openFromUrl();
  document.fonts?.ready.then(() => window.ScrollTrigger?.refresh());
}

start();
