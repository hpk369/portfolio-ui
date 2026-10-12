// Fades [data-reveal] blocks up as they enter the viewport (CSS does the motion).
// Siblings stagger slightly so a group of paragraphs reads top to bottom.

import { reducedMotion } from './env.js';

export function initScrollReveal() {
  const items = [...document.querySelectorAll('[data-reveal]')];
  if (!items.length) return;
  if (reducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const siblings = [...el.parentElement.querySelectorAll(':scope > [data-reveal]')];
      el.style.transitionDelay = `${Math.max(0, siblings.indexOf(el)) * 90}ms`;
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  items.forEach((el) => io.observe(el));
}
