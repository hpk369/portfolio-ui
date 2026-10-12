// Projects section. The list, previews and demo links are static HTML written by
// scripts/build_project_pages.py, so everything works without JavaScript.
// On wide screens this moves the previews into one sticky stage on the right and
// shows the preview of whichever title sits in the middle of the viewport. The red
// ribbon behind the list draws itself as the section scrolls past.

import { createProjectCard } from '../../kit/js/project-card.js';
import { SITE_ROOT, projectUrl, reducedMotion } from './env.js';

const isPlainClick = (e) => e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey);

// Titles and in-site demo links open the project panel instead of navigating.
export function wirePanelLinks(root, openPanel) {
  root.querySelectorAll('a[data-slug]').forEach((a) => { a.href = projectUrl(a.dataset.slug); });
  root.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-slug]');
    if (!link || !isPlainClick(event)) return;
    event.preventDefault();
    openPanel(link.dataset.slug, { trigger: link });
  });
}

// Media paths are relative to the home page. The panel changes the address bar,
// so lazy images and clips must not resolve against /projects/<slug>/.
export function absolutizeMedia(root) {
  root.querySelectorAll('img[data-video]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), SITE_ROOT).href;
    img.dataset.video = new URL(img.dataset.video, SITE_ROOT).href;
  });
}

// Projects without an image get the HTML preview card instead of a text tile.
export function upgradeTiles(root, projects) {
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  root.querySelectorAll('[data-card]').forEach((tile) => {
    const project = bySlug.get(tile.dataset.card);
    if (!project?.card) return;
    tile.replaceChildren(createProjectCard(project));
    tile.classList.add('has-card');
  });
}

// Swap a poster for its looping clip the first time the preview is shown.
function playClip(figure) {
  if (reducedMotion) return;
  const img = figure.querySelector('img[data-video]');
  if (img) {
    const video = document.createElement('video');
    video.className = img.className;
    Object.assign(video, { muted: true, loop: true, playsInline: true, poster: img.currentSrc || img.src });
    video.setAttribute('aria-label', img.alt);
    video.src = img.dataset.video;
    img.replaceWith(video);
  }
  figure.querySelector('video')?.play().catch(() => { /* autoplay blocked: the poster stays */ });
}

function initRibbon(section) {
  const svg = section.querySelector('.ribbon');
  const path = svg?.querySelector('.ribbon__path');
  if (!path) return () => {};
  let length = 0;

  // A meander that swings between the edges, one swing per ~700px of section.
  const build = () => {
    const w = section.clientWidth;
    const h = section.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const xs = [0.18, 0.88, 0.06, 0.62, 0.95, 0.1, 0.78];
    const swings = Math.max(3, Math.round(h / 700));
    let x0 = -0.05 * w;
    let y0 = 0.04 * h;
    let d = `M ${x0} ${y0}`;
    for (let k = 1; k <= swings; k++) {
      const x1 = xs[k % xs.length] * w;
      const y1 = (k / swings) * h * 0.98;
      const dy = (y1 - y0) * 0.6;
      d += ` C ${x0 + (x1 - x0) * 0.1} ${y0 + dy}, ${x1} ${y1 - dy}, ${x1} ${y1}`;
      x0 = x1;
      y0 = y1;
    }
    path.setAttribute('d', d);
    length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    draw();
  };

  // The tip of the ribbon stays near three-quarters of the way down the screen.
  const draw = () => {
    if (!length) return;
    const r = section.getBoundingClientRect();
    const progress = reducedMotion ? 1 : Math.min(1, Math.max(0, (window.innerHeight * 0.75 - r.top) / r.height));
    path.style.strokeDashoffset = `${length * (1 - progress)}`;
  };

  new ResizeObserver(build).observe(section);
  return draw;
}

export function initShowcase({ projects, openPanel }) {
  const section = document.getElementById('demos');
  if (!section) return;
  const stage = section.querySelector('.showcase__stage');
  const items = [...section.querySelectorAll('.showcase__item')];
  const titles = items.map((li) => li.querySelector('.showcase__title'));
  const figures = items.map((li) => li.querySelector('.showcase__figure'));

  absolutizeMedia(section);
  wirePanelLinks(section, openPanel);
  upgradeTiles(section, projects);
  const drawRibbon = initRibbon(section);

  const wide = window.matchMedia('(min-width: 900px)');
  let staged = false;
  let active = -1;

  function setActive(i) {
    if (i === active) return;
    active = i;
    items.forEach((li, j) => li.classList.toggle('is-active', j === i));
    figures.forEach((fig, j) => {
      const on = j === i;
      fig.classList.toggle('is-active', on);
      if (staged) fig.inert = !on;
      if (on) playClip(fig);
      else fig.querySelector('video')?.pause();
    });
  }

  // The active title is the one closest to the middle of the viewport.
  function update() {
    drawRibbon();
    const mid = window.innerHeight / 2;
    let best = 0;
    let bestDistance = Infinity;
    titles.forEach((t, i) => {
      const r = t.getBoundingClientRect();
      const distance = Math.abs(r.top + r.height / 2 - mid);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    setActive(best);
  }

  function setStaged(on) {
    staged = on;
    section.classList.toggle('is-staged', on);
    figures.forEach((fig, i) => {
      (on ? stage : items[i]).append(fig);
      fig.inert = on && i !== active;
    });
  }

  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }, { passive: true });

  // Keyboard: focusing a title shows its preview.
  titles.forEach((t, i) => t.addEventListener('focus', () => setActive(i)));

  wide.addEventListener('change', (e) => setStaged(e.matches));
  setStaged(wide.matches);
  update();
}
