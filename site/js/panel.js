// J · Project panel (spec §5 J): a modal <dialog> with its own URL.
// Opens from the spiral pill, a list item, or a direct visit to
// /projects/<slug>/ (that static page forwards here with ?project=<slug>).

import { Dialog } from '../../kit/js/dialog.js';
import { ReplayPlayer } from '../../kit/js/replay-player.js';
import { SITE_ROOT, dataUrl, pad, projectUrl, reducedMotion, scroller } from './env.js';

const PLACEHOLDER = {
  pitch: '[One-sentence pitch to come]',
  proves: '[To come]',
};

const CLOSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function textOrPlaceholder(tag, className, value, key) {
  const node = el(tag, className);
  if (value) node.textContent = value;
  else node.append(el('span', 'is-placeholder', PLACEHOLDER[key]));
  return node;
}

function titleNode(project) {
  const h2 = el('h2', 'panel__title');
  h2.id = 'panel-title';
  h2.tabIndex = -1;
  const { title, titleItalicWord: italic } = project;
  if (italic && title.endsWith(italic)) {
    h2.append(title.slice(0, -italic.length), el('em', 'em-muted', italic));
  } else {
    h2.textContent = title;
  }
  return h2;
}

function linkPill(label, href) {
  if (href) {
    const a = el('a', 'pill', label);
    a.href = href;
    return a;
  }
  const span = el('span', 'pill is-disabled');
  span.setAttribute('aria-disabled', 'true');
  span.append(label, ' ', el('span', 'is-placeholder', '· to come'));
  return span;
}

export function initPanel({ projects }) {
  const dialogEl = document.getElementById('panel');
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  const homeTitle = document.title;
  const homeUrl = SITE_ROOT.href;
  let player = null;
  let pushed = false;
  let currentSlug = null;

  const dialog = new Dialog(dialogEl, { onRequestClose: () => close() });

  function teardown() {
    player?.destroy();
    player = null;
  }

  function renderDemo(project, stage, happened, scenarioId) {
    teardown();
    stage.replaceChildren();
    happened.replaceChildren();

    if (project.demoMode === 'replay') {
      const scenario = project.scenarios.find((s) => s.id === scenarioId);
      player = new ReplayPlayer(stage, { autoplay: true, heading: `${project.title} · ${scenario.label}` });
      player.load(dataUrl(scenario.replay)).catch(() => {
        stage.replaceChildren(el('p', 'is-placeholder', 'The replay could not load. Try the static page instead.'));
      });
      const lines = project.whatHappened?.[scenarioId];
      if (lines) happened.append(el('span', 'meta-label', 'What just happened · '), lines.join(' '));
      return;
    }

    if (project.demoMode === 'embed') {
      const box = el('div', 'embed');
      const frame = el('iframe');
      frame.src = project.embed;
      frame.title = `${project.title} demo`;
      box.append(frame);
      const open = el('a', 'pill', 'Open the demo in a new tab ↗');
      open.href = project.embed;
      open.target = '_blank';
      open.rel = 'noopener';
      stage.append(box, open);
      return;
    }

    const box = el('div', 'demo-placeholder');
    box.append(
      el('p', 'demo-placeholder__title', 'Demo coming soon'),
      el('p', 'meta-label', 'This project is being rebuilt so you can try it in under a minute.'),
    );
    stage.append(box);
    if (project.links?.existingDemo) {
      const link = el('a', 'pill', 'See the current demo ↗');
      link.href = project.links.existingDemo;
      link.target = '_blank';
      link.rel = 'noopener';
      stage.append(link);
    }
  }

  function render(project) {
    const index = projects.indexOf(project);
    const inner = el('div', 'panel__inner');

    const info = el('div', 'panel__info');
    const title = titleNode(project);
    const facts = el('dl', 'facts');
    for (const [label, node] of [
      ['Proves', textOrPlaceholder('dd', '', project.proves, 'proves')],
      ['Demo', el('dd', '', project.demoLabel ?? 'Coming soon')],
    ]) {
      const row = el('div');
      row.append(el('dt', 'meta-label', label), node);
      facts.append(row);
    }
    const links = el('div', 'panel__links');
    links.append(
      linkPill('How it works', project.links?.howItWorks),
      linkPill('Source', project.links?.source),
      linkPill('90s video', project.links?.video),
    );
    info.append(
      el('p', 'meta-label panel__meta', `${pad(index + 1)} / ${pad(projects.length)} · /projects/${project.slug}`),
      title,
      textOrPlaceholder('p', 'panel__pitch', project.pitch, 'pitch'),
      facts,
      el('span', 'panel__spacer'),
      links,
    );

    const demo = el('div', 'panel__demo');
    const stage = el('div', 'panel__stage');
    const happened = el('p', 'what-happened');
    happened.setAttribute('aria-live', 'polite');
    if (project.scenarios?.length > 1) {
      const pills = el('div', 'scenario-pills');
      pills.setAttribute('role', 'group');
      pills.setAttribute('aria-label', 'Examples');
      const first = project.scenarios.find((s) => s.default) ?? project.scenarios[0];
      project.scenarios.forEach((scenario) => {
        const button = el('button', 'pill', scenario.label);
        button.type = 'button';
        button.setAttribute('aria-pressed', String(scenario === first));
        button.addEventListener('click', () => {
          pills.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
          renderDemo(project, stage, happened, scenario.id);
        });
        pills.append(button);
      });
      demo.append(pills);
      demo.append(stage, happened);
      renderDemo(project, stage, happened, first.id);
    } else {
      demo.append(stage, happened);
      renderDemo(project, stage, happened, project.scenarios?.[0]?.id);
    }

    inner.append(info, demo);
    const closeBtn = el('button', 'icon-btn icon-btn--light panel__close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close project');
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.addEventListener('click', () => close());

    dialogEl.replaceChildren(inner, closeBtn);
    return title;
  }

  function open(slug, { trigger = null, push = true } = {}) {
    const project = bySlug.get(slug);
    if (!project) return false;
    const title = render(project);
    currentSlug = slug;
    document.title = `${project.title} · Harsh Keshruwala`;
    scroller.stop();

    const show = () => dialog.open({ trigger, focus: title });
    const canMorph = !reducedMotion && trigger && typeof document.startViewTransition === 'function';
    if (canMorph) {
      dialogEl.classList.add('no-anim');
      trigger.style.viewTransitionName = 'project-panel';
      try {
        const transition = document.startViewTransition(() => {
          trigger.style.viewTransitionName = '';
          dialogEl.style.viewTransitionName = 'project-panel';
          show();
        });
        transition.finished.finally(() => { dialogEl.style.viewTransitionName = ''; });
      } catch {
        trigger.style.viewTransitionName = '';
        show();
      }
    } else {
      dialogEl.classList.remove('no-anim');
      show();
    }

    if (push) {
      history.pushState({ project: slug }, '', projectUrl(slug));
      pushed = true;
    }
    return true;
  }

  function close({ fromHistory = false } = {}) {
    if (!dialog.isOpen) return;
    teardown();
    dialog.close();
    dialogEl.replaceChildren();
    currentSlug = null;
    document.title = homeTitle;
    scroller.start();
    if (fromHistory) return;
    if (pushed) {
      pushed = false;
      history.back();
    } else {
      history.replaceState(null, '', homeUrl);
    }
  }

  window.addEventListener('popstate', (event) => {
    const slug = event.state?.project;
    pushed = false;
    if (slug && slug !== currentSlug) open(slug, { push: false });
    else if (!slug) close({ fromHistory: true });
  });

  // A direct visit to /projects/<slug>/ arrives as ?project=<slug>.
  function openFromUrl() {
    const slug = new URLSearchParams(window.location.search).get('project');
    if (!slug || !bySlug.has(slug)) {
      if (slug) history.replaceState(null, '', homeUrl);
      return;
    }
    history.replaceState({ project: slug }, '', projectUrl(slug));
    open(slug, { push: false });
  }

  return { open, close, openFromUrl };
}
