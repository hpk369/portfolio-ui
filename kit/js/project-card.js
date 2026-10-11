// ProjectCard (spec §8): an HTML/CSS preview of a project, used by the spiral
// and the list's hover preview. Everything shown is synthetic (spec §6).
//   createProjectCard({ title, card: { bg, label, preview } }) → <div class="pcard">

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function lines(texts, className = 'pcard__mono') {
  return texts.map((t) => el('span', className, t));
}

const PREVIEWS = {
  steps() {
    return [
      ...lines(['0.9s  tool_call · schema_comparator', '1.7s  tool_result · 2 columns changed']),
      el('span', 'pcard__mono pcard__mono--ink', '3.2s  explaining what broke…'),
      el('span', 'pcard__chip pcard__chip--ember', 'P1 · page on-call'),
    ];
  },
  bars() {
    const bars = el('span', 'pcard__bars');
    [40, 55, 48, 90, 50, 62].forEach((h, i) => {
      const bar = el('span', i === 3 ? 'is-flagged' : '');
      bar.style.height = `${h}%`;
      bars.append(bar);
    });
    return [bars];
  },
  code() {
    return [el('span', 'pcard__big', '429'), el('span', 'pcard__small', 'Too many requests: back off and retry with jitter.')];
  },
  chat() {
    return [el('span', 'pcard__bubble', 'The international wire fee is [AMOUNT].'), el('span', 'pcard__chip', 'source · fees.md §3')];
  },
  tools() {
    return lines(['→ list_sla_breaches()', '← 3 tickets at risk', '→ get_ticket(4821)'], 'pcard__mono pcard__mono--tint');
  },
  line() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 60');
    svg.setAttribute('class', 'pcard__spark');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M0 48 H120 L132 8 L144 48 H200');
    svg.append(path);
    return [svg, el('span', 'pcard__mono pcard__mono--ember pcard__end', 'spike · key-07')];
  },
  posters() {
    const grid = el('span', 'pcard__posters');
    for (let i = 0; i < 4; i++) grid.append(el('span'));
    return [grid];
  },
  chain() {
    const chain = el('span', 'pcard__chain');
    for (let i = 0; i < 4; i++) {
      if (i) chain.append(el('span', i === 3 ? 'pcard__link is-broken' : 'pcard__link'));
      chain.append(el('span', i === 3 ? 'pcard__block is-broken' : 'pcard__block', `#${i + 1}`));
    }
    return [chain];
  },
  terminal() {
    return lines(['> SET greeting hello', 'OK', '> GET greeting', '"hello"'], 'pcard__mono pcard__mono--tint');
  },
  store() {
    const row = el('span', 'pcard__store');
    for (let i = 0; i < 3; i++) row.append(el('span'));
    return [row, el('span', 'pcard__chip pcard__cart', 'cart · 2')];
  },
};

export function createProjectCard(project) {
  const { card } = project;
  const root = el('div', `pcard pcard--${card.preview}`);
  root.style.setProperty('--card-bg', card.bg);
  root.style.setProperty('--card-label', card.label);
  root.append(el('span', 'pcard__name', project.title));
  const body = el('span', 'pcard__body');
  body.append(...(PREVIEWS[card.preview]?.() ?? []));
  root.append(body);
  return root;
}
