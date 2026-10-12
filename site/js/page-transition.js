// Page-to-page transition (home ⇄ Work): the page fades to black on the
// signature curve, then the browser navigates. The next page fades or animates
// in on its own. Links opt in with data-transition; reduced motion skips it.

import { reducedMotion } from './env.js';

const DURATION = 600;
const isPlainClick = (e) => e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey);

export function initPageTransitions() {
  const root = document.documentElement;
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-transition]');
    if (!link || event.defaultPrevented || !isPlainClick(event) || reducedMotion) return;
    event.preventDefault();
    try { sessionStorage.setItem('hk-page-in', '1'); } catch (e) { /* storage blocked: no fade-in */ }
    root.classList.add('is-leaving');
    setTimeout(() => { location.href = link.href; }, DURATION);
  });
  // Back/forward cache restores the faded page; undo the fade.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) root.classList.remove('is-leaving');
  });
}
