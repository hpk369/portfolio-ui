// H · Spiral view (spec §5 H): a CSS 3D helix of project cards.
// The page scroll is the single source of truth: the section pins for ~80vh per
// card and the scroll position maps to the spiral's position. Drag, keys and the
// snap all just move the scroll, so every input agrees.

import { createProjectCard } from '../../kit/js/project-card.js';
import { pad, projectUrl, reducedMotion, scroller } from './env.js';

const RADIUS = 340;
const PITCH = 90;
const VH_PER_CARD = 0.8;
const SNAP_DELAY = 140;
const DRAG_PX_PER_CARD = 220;

export function createSpiral({ projects, openPanel }) {
  const { ScrollTrigger } = window;
  const section = document.getElementById('demos');
  const view = section.querySelector('.projects__spiral-view');
  const spiral = view.querySelector('.spiral');
  const stage = view.querySelector('.spiral__stage');
  const pill = view.querySelector('.spiral-pill');
  const pillIndex = pill.querySelector('.spiral-pill__index');
  const pillTitle = pill.querySelector('.spiral-pill__title');
  const count = view.querySelector('.spiral__count');
  const status = view.querySelector('#spiral-status');
  const n = projects.length;
  const step = 360 / n;

  view.querySelector('.spiral__total').textContent = n;

  const cards = projects.map((project, i) => {
    const card = document.createElement('div');
    card.className = 'spiral-card';
    card.dataset.tilt = String((i % 2 ? 1 : -1) * (3 + (i * 7) % 4));
    card.append(createProjectCard(project));
    stage.append(card);
    return card;
  });

  let pos = 0;
  let active = -1;
  let trigger = null;
  let snapTimer = 0;
  let announceTimer = 0;
  let drag = null;
  let suppressClick = false;

  function setActive(i) {
    active = i;
    const project = projects[i];
    cards.forEach((card, j) => card.classList.toggle('is-active', j === i));
    pill.href = projectUrl(project.slug);
    pill.dataset.slug = project.slug;
    pillIndex.textContent = pad(i + 1);
    pillTitle.textContent = project.title;
    count.textContent = `${pad(i + 1)} / ${pad(n)}`;
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      status.textContent = `Project ${i + 1} of ${n}: ${project.title}`;
    }, 300);
  }

  function render() {
    cards.forEach((card, i) => {
      // Wrap around the ring so cards sit on both sides of the active one; fade
      // them out at the seam behind the helix so the wrap never shows.
      let d = i - pos;
      d = ((d % n) + n + n / 2) % n - n / 2;
      const seam = 1 - (Math.abs(d) / (n / 2)) ** 4;
      const theta = (d * step * Math.PI) / 180;
      const x = RADIUS * Math.sin(theta);
      const z = RADIUS * Math.cos(theta);
      const y = d * PITCH;
      const rotY = -55 * Math.sin(theta);
      const tilt = Math.abs(d) < 0.5 ? 0 : Number(card.dataset.tilt);
      card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg) rotateZ(${tilt}deg)`;
      card.style.opacity = ((0.35 + (0.65 * (z + RADIUS)) / (2 * RADIUS)) * seam).toFixed(3);
    });
    const i = Math.max(0, Math.min(n - 1, Math.round(pos)));
    if (i !== active) setActive(i);
  }

  const scrollFor = (i) => trigger.start + (i / (n - 1)) * (trigger.end - trigger.start);

  function go(i, { immediate = false } = {}) {
    if (!trigger) return;
    const target = Math.max(0, Math.min(n - 1, i));
    scroller.to(scrollFor(target), { immediate, duration: reducedMotion ? 0 : 0.6 });
  }

  function snap() {
    if (!trigger || drag || !trigger.isActive) return;
    const nearest = Math.round(pos);
    if (Math.abs(nearest - pos) > 0.01) scroller.to(scrollFor(nearest), { duration: 0.42 });
  }

  function onKey(event) {
    const keys = {
      ArrowRight: active + 1, ArrowDown: active + 1, PageDown: active + 1,
      ArrowLeft: active - 1, ArrowUp: active - 1, PageUp: active - 1,
      Home: 0, End: n - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    go(keys[event.key]);
  }

  function onPointerDown(event) {
    if (event.button !== 0 || !trigger) return;
    drag = { x: event.clientX, scroll: window.scrollY, moved: false };
    spiral.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    if (Math.abs(dx) > 5) drag.moved = true;
    if (!drag.moved) return;
    const perCard = (trigger.end - trigger.start) / (n - 1);
    const y = Math.max(trigger.start, Math.min(trigger.end, drag.scroll - (dx / DRAG_PX_PER_CARD) * perCard));
    scroller.to(y, { immediate: true });
  }

  function onPointerUp(event) {
    if (!drag) return;
    suppressClick = drag.moved;
    drag = null;
    if (spiral.hasPointerCapture(event.pointerId)) spiral.releasePointerCapture(event.pointerId);
    snap();
  }

  function onCardClick(event) {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const card = event.target.closest('.spiral-card');
    if (!card) return;
    const i = cards.indexOf(card);
    if (i === active) openPanel(projects[i].slug, { trigger: pill });
    else go(i);
  }

  function onPillClick(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openPanel(pill.dataset.slug, { trigger: pill });
  }

  return {
    enable() {
      view.hidden = false;
      section.dataset.view = 'spiral';
      trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${(n - 1) * window.innerHeight * VH_PER_CARD}`,
        pin: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          pos = self.progress * (n - 1);
          render();
          clearTimeout(snapTimer);
          snapTimer = setTimeout(snap, SNAP_DELAY);
        },
      });
      spiral.addEventListener('keydown', onKey);
      pill.addEventListener('keydown', onKey);
      spiral.addEventListener('pointerdown', onPointerDown);
      spiral.addEventListener('pointermove', onPointerMove);
      spiral.addEventListener('pointerup', onPointerUp);
      spiral.addEventListener('pointercancel', onPointerUp);
      spiral.addEventListener('click', onCardClick);
      pill.addEventListener('click', onPillClick);
      render();
    },
    disable() {
      clearTimeout(snapTimer);
      trigger?.kill(true);
      trigger = null;
      spiral.removeEventListener('keydown', onKey);
      pill.removeEventListener('keydown', onKey);
      spiral.removeEventListener('pointerdown', onPointerDown);
      spiral.removeEventListener('pointermove', onPointerMove);
      spiral.removeEventListener('pointerup', onPointerUp);
      spiral.removeEventListener('pointercancel', onPointerUp);
      spiral.removeEventListener('click', onCardClick);
      pill.removeEventListener('click', onPillClick);
      view.hidden = true;
      section.dataset.view = 'list';
    },
  };
}
