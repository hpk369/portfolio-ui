// Shared environment for the site modules.
// URLs are resolved from this file's location, not the page URL, because the
// panel changes the address bar with pushState (spec §5 J).

export const SITE_ROOT = new URL('../', import.meta.url);
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const projectUrl = (slug) => new URL(`projects/${slug}/`, SITE_ROOT).href;
export const dataUrl = (path) => new URL(`data/${path}`, SITE_ROOT).href;
export const pad = (n) => String(n).padStart(2, '0');

const TIER_ORDER = { featured: 0, supporting: 1, more: 2 };
let projectsPromise;

// Only "ready" projects render anywhere (spec §6); featured tier first.
export function loadProjects() {
  projectsPromise ??= fetch(dataUrl('projects.json'))
    .then((r) => {
      if (!r.ok) throw new Error(`projects.json: HTTP ${r.status}`);
      return r.json();
    })
    .then((list) => list
      .filter((p) => p.ready)
      .sort((a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9)));
  return projectsPromise;
}

// One scroll API whether or not Lenis is running.
export const scroller = {
  lenis: null,
  y(target) {
    return typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
  },
  to(target, { immediate = false, duration = 1 } = {}) {
    const top = this.y(target);
    if (this.lenis) {
      this.lenis.scrollTo(top, { immediate: immediate || reducedMotion, duration, force: true });
    } else {
      window.scrollTo({ top, behavior: immediate || reducedMotion ? 'instant' : 'smooth' });
    }
  },
  stop() { this.lenis?.stop(); },
  start() { this.lenis?.start(); },
};
