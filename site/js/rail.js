// Section rail and scroll counter (spec §5, frame G). Desktop only (CSS hides them
// below 1024px). Both appear from the first scroll onward.

import { pad } from './env.js';

export function initRail() {
  const rail = document.querySelector('.rail');
  const count = document.querySelector('.scroll-count');
  if (!rail) return;
  const links = [...rail.querySelectorAll('a')];

  const setActive = (id) => links.forEach((a) => {
    if (a.hash === `#${id}`) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id));
  }, { rootMargin: '-45% 0px -45% 0px' });
  links.forEach((a) => {
    const section = document.querySelector(a.hash);
    if (section) io.observe(section);
  });

  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    count.textContent = `(${pad(Math.min(99, Math.round(progress * 100)))})`;
    const show = window.scrollY > window.innerHeight * 0.08;
    rail.classList.toggle('is-visible', show);
    count.classList.toggle('is-visible', show);
  };
  window.addEventListener('scroll', () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}
