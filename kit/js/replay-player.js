// ReplayPlayer (spec §8): plays a replay JSON as a timed list of steps.
//
// Format (CLAUDE.md, "Replay recording format"):
//   { "id", "title", "source": "recorded" | "synthetic", "recorded_at": "YYYY-MM-DD" | null,
//     "model": "<model>" | null,
//     "steps": [{ "t_ms": 0, "type": "event", "label": "...", "payload": { "text": "..." } }, ...],
//     "outcome": { "summary": "...", "severity": "P1" } }
// Step types: event, tool_call, tool_result, message, metric, log, alert.
// `payload.text` shows under the label; other payload keys show as "key: value".
// Text wrapped in `backticks` renders as code. Optional "duration_ms" sets the total length.
//
// Usage:
//   const player = new ReplayPlayer(container, { autoplay: false, heading: 'etl-triage · schema drift' });
//   await player.load('data/replays/etl-schema-drift.json');
//   player.addEventListener('step', (e) => console.log(e.detail.index, e.detail.step));
//
// Events: "load", "step" ({ index, step }), "play", "pause", "end".
// Keys (while focus is inside the player): Space plays/pauses, ← and → step.

import { createRecordedLabel } from './recorded-label.js';

const SPEEDS = [0.5, 1, 2];
const MAX_FRAME_MS = 100; // a background tab must not jump the replay forward

const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>';

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

// Renders `code` spans without innerHTML, so replay text can never inject markup.
function richText(text) {
  const frag = document.createDocumentFragment();
  String(text).split('`').forEach((part, i) => {
    if (!part) return;
    if (i % 2) {
      const code = el('code');
      code.textContent = part;
      frag.append(code);
    } else {
      frag.append(part);
    }
  });
  return frag;
}

const pad = (n) => String(n).padStart(2, '0');

function payloadText(payload) {
  if (!payload) return '';
  if (payload.text) return payload.text;
  return Object.entries(payload)
    .filter(([, value]) => value !== null && typeof value !== 'object')
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ');
}

export class ReplayPlayer extends EventTarget {
  constructor(container, { autoplay = false, speed = 1, heading = null } = {}) {
    super();
    this.container = container;
    this.heading = heading;
    this.autoplay = autoplay;
    this.speed = SPEEDS.includes(speed) ? speed : 1;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.replay = null;
    this.index = -1;
    this.elapsed = 0;
    this.playing = false;
    this._raf = 0;
    this._last = 0;
    this._tick = this._tick.bind(this);
    this._onKey = this._onKey.bind(this);
  }

  async load(source) {
    const replay = typeof source === 'string' ? await fetch(source).then((r) => {
      if (!r.ok) throw new Error(`Replay ${source}: HTTP ${r.status}`);
      return r.json();
    }) : source;
    if (!Array.isArray(replay.steps) || !replay.steps.length) throw new Error(`Replay "${replay.id}" has no steps.`);

    this.pause();
    this.replay = replay;
    this.duration = replay.duration_ms ?? replay.steps.at(-1).t_ms + 1500;
    this._render();

    if (this.reducedMotion) {
      // Everything at once; Play still walks through it step by step.
      this._seek(this.duration);
    } else {
      this._seek(0);
      if (this.autoplay) this.play();
    }
    this.dispatchEvent(new CustomEvent('load', { detail: { replay } }));
    return this;
  }

  play() {
    if (!this.replay || this.playing) return;
    if (this.elapsed >= this.duration) this._seek(0);
    this.playing = true;
    this._last = performance.now();
    this._raf = requestAnimationFrame(this._tick);
    this._syncControls();
    this.dispatchEvent(new Event('play'));
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    cancelAnimationFrame(this._raf);
    this._syncControls();
    this.dispatchEvent(new Event('pause'));
  }

  toggle() {
    this.playing ? this.pause() : this.play();
  }

  stepTo(i) {
    if (!this.replay) return;
    const last = this.replay.steps.length - 1;
    const index = Math.max(-1, Math.min(last, i));
    this.pause();
    this._seek(index < 0 ? 0 : this.replay.steps[index].t_ms, index);
    this._announce();
  }

  next() { this.stepTo(this.index + 1); }
  prev() { this.stepTo(this.index - 1); }

  setSpeed(speed) {
    if (!SPEEDS.includes(speed)) return;
    this.speed = speed;
    this._syncControls();
  }

  destroy() {
    this.pause();
    this.root?.removeEventListener('keydown', this._onKey);
    this.root?.remove();
  }

  // --- internals ---

  _tick(now) {
    const dt = Math.min(now - this._last, MAX_FRAME_MS);
    this._last = now;
    this._seek(this.elapsed + dt * this.speed);
    if (this.elapsed >= this.duration) {
      this.pause();
      this.dispatchEvent(new Event('end'));
      return;
    }
    this._raf = requestAnimationFrame(this._tick);
  }

  // Moves the clock; reveals every step whose time has come. `forceIndex` lets
  // manual stepping land exactly on a step even when two share a timestamp.
  _seek(ms, forceIndex) {
    const steps = this.replay.steps;
    this.elapsed = Math.max(0, Math.min(this.duration, ms));
    let index = forceIndex;
    if (index === undefined) {
      index = -1;
      while (index + 1 < steps.length && steps[index + 1].t_ms <= this.elapsed) index++;
    }
    const changed = index !== this.index;
    this.index = index;

    this.bar.style.transform = `scaleX(${this.elapsed / this.duration})`;
    if (!changed) return;

    this.items.forEach((item, i) => {
      item.hidden = i > index;
      item.classList.toggle('is-active', i === index);
      if (i === index) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    this.count.textContent = `${pad(Math.max(index + 1, 0))} / ${pad(steps.length)}`;
    // Keep the newest step in view without scrolling the page.
    this.list.scrollTop = this.list.scrollHeight;
    if (index >= 0) this.dispatchEvent(new CustomEvent('step', { detail: { index, step: steps[index] } }));
  }

  _announce() {
    const step = this.replay.steps[this.index];
    this.status.textContent = step
      ? `Step ${this.index + 1} of ${this.replay.steps.length}: ${step.label.replaceAll('`', '')}`
      : 'Start of replay';
  }

  _syncControls() {
    this.playBtn.innerHTML = this.playing ? ICON_PAUSE : ICON_PLAY;
    this.playBtn.setAttribute('aria-label', this.playing ? 'Pause replay' : 'Play replay');
    this.speedBtns.forEach((btn) => btn.setAttribute('aria-pressed', String(Number(btn.dataset.speed) === this.speed)));
    this.root.classList.toggle('is-playing', this.playing);
  }

  _onKey(event) {
    const onButton = event.target.closest('button');
    if (event.key === ' ' && !onButton) {
      event.preventDefault();
      this.toggle();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev();
    }
  }

  _render() {
    const { replay } = this;
    this.root?.remove();

    const root = el('div', 'replay', {
      role: 'group',
      tabindex: '0',
      'aria-label': `Replay: ${replay.title}. Space plays or pauses; arrow keys step.`,
    });

    const head = el('div', 'replay__head');
    const dots = el('span', 'replay__dots', { 'aria-hidden': 'true' });
    dots.append(el('span'), el('span'), el('span'));
    const title = el('p', 'replay__title meta-label');
    title.textContent = this.heading ?? replay.title;
    head.append(dots, title, createRecordedLabel(replay));

    const list = el('ol', 'replay__steps');
    this.items = replay.steps.map((step) => {
      const item = el('li', 'replay__step');
      item.dataset.type = step.type;
      const time = el('span', 'replay__time');
      time.textContent = `${(step.t_ms / 1000).toFixed(1)}s`;
      const type = el('span', 'replay__type');
      type.textContent = step.type;
      const label = el('span', 'replay__label');
      label.append(richText(step.label));
      item.append(time, type, label);
      const detailText = payloadText(step.payload);
      if (detailText) {
        const detail = el('span', 'replay__detail');
        detail.append(richText(detailText));
        item.append(detail);
      }
      list.append(item);
      return item;
    });

    const controls = el('div', 'replay__controls');
    const playBtn = el('button', 'icon-btn replay__play', { type: 'button' });
    playBtn.addEventListener('click', () => this.toggle());

    const progress = el('div', 'replay__progress', { 'aria-hidden': 'true' });
    const bar = el('span', 'replay__bar');
    progress.append(bar);

    const count = el('span', 'replay__count meta-label');

    const speed = el('div', 'replay__speed', { role: 'group', 'aria-label': 'Playback speed' });
    this.speedBtns = SPEEDS.map((s) => {
      const btn = el('button', 'pill pill--small', { type: 'button', 'data-speed': String(s) });
      btn.textContent = `${s}×`;
      btn.addEventListener('click', () => this.setSpeed(s));
      speed.append(btn);
      return btn;
    });

    controls.append(playBtn, progress, count, speed);

    const status = el('p', 'sr-only', { 'aria-live': 'polite' });

    root.append(head, list, controls, status);
    root.addEventListener('keydown', this._onKey);
    this.container.append(root);

    Object.assign(this, { root, list, playBtn, bar, count, status });
    this.index = -2; // force the first _seek to paint
    this._syncControls();
  }
}
