// I · List view (spec §5 I). The list itself is static HTML written by
// scripts/build_project_pages.py, so it works without JavaScript; this adds the
// floating preview (pointer devices only) and opens projects in the panel.

import { createProjectCard } from '../../kit/js/project-card.js';
import { projectUrl, reducedMotion } from './env.js';

const CARD_W = 300;
const CARD_H = 196;

export function initList({ projects, openPanel }) {
  const list = document.querySelector('.plist');
  const preview = document.querySelector('.list-preview');
  if (!list) return;
  const bySlug = new Map(projects.map((p) => [p.slug, p]));

  // Absolute hrefs keep working after the panel changes the address bar.
  list.querySelectorAll('.plist__link').forEach((a) => { a.href = projectUrl(a.dataset.slug); });

  list.addEventListener('click', (event) => {
    const link = event.target.closest('.plist__link');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openPanel(link.dataset.slug, { trigger: link });
  });

  if (!preview || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let current = null;
  let visible = false;
  let x = 0, y = 0, tx = 0, ty = 0;
  let raf = 0;

  const place = () => {
    preview.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(-3deg)`;
  };

  const loop = () => {
    const ease = reducedMotion ? 1 : 0.16;
    x += (tx - x) * ease;
    y += (ty - y) * ease;
    place();
    raf = visible && (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) ? requestAnimationFrame(loop) : 0;
  };

  const target = (px, py) => {
    tx = Math.min(px + 40, window.innerWidth - CARD_W - 16);
    ty = Math.max(16, Math.min(py - CARD_H / 2, window.innerHeight - CARD_H - 16));
    if (!raf) raf = requestAnimationFrame(loop);
  };

  const show = (link, px, py) => {
    const project = bySlug.get(link.dataset.slug);
    if (!project) return;
    if (current !== project.slug) {
      preview.replaceChildren(createProjectCard(project));
      current = project.slug;
    }
    if (!visible) {
      target(px, py);
      x = tx;
      y = ty;
      place();
    }
    visible = true;
    preview.classList.add('is-visible');
    target(px, py);
  };

  const hide = () => {
    visible = false;
    preview.classList.remove('is-visible');
  };

  list.addEventListener('pointerover', (event) => {
    const link = event.target.closest('.plist__link');
    if (link) show(link, event.clientX, event.clientY);
  });
  list.addEventListener('pointermove', (event) => {
    if (visible) target(event.clientX, event.clientY);
  });
  list.addEventListener('pointerleave', hide);
  list.addEventListener('focusin', (event) => {
    const link = event.target.closest('.plist__link');
    if (!link) return;
    const r = link.getBoundingClientRect();
    show(link, r.right, r.top + r.height / 2);
  });
  list.addEventListener('focusout', (event) => {
    if (!list.contains(event.relatedTarget)) hide();
  });
  window.addEventListener('scroll', () => visible && !list.matches(':hover') && !list.contains(document.activeElement) && hide(), { passive: true });
}
