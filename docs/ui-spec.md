# Portfolio UI Spec — "Ember" direction

Build spec for Claude Code. It turns the approved storyboard (canvas row 7, frames F–J) into a working site.

- **Owner:** Harsh Keshruwala
- **Status:** approved direction, ready to build · Oct 11, 2026
- **Design canvas (private):** https://claude.ai/artifact/8rpSbWm9Lrq4pm127AVNCe (row 7: "Your pick")
- **Read first:** `CLAUDE.md` (portfolio rules) and "Portfolio Project Plan — Customer Engineer". If this spec conflicts with either, stop and ask Harsh.

---

## 0. Before writing any code: ask Harsh

These are open. Don't assume; ask with the options listed and the recommendation.

1. **Repo name and shape.**
   - A (recommended): one new repo, proposed `hpk369/portfolio-ui`, holding the shared kit (`/kit`) and the portfolio site (`/site`). Project demos load the kit from a pinned, versioned GitHub Pages URL.
   - B: keep the site in `hpk369/hpk-website` and put only the kit in a new repo.
2. **Demo domain:** `hpk369.github.io` or `demo.inkandinfra.com` (already used by the triage agent).
3. **Fictional store name** for the e-commerce project card (until then, use "E-commerce Front End").
4. **Which projects pass the 60-second test today.** Only those appear in the spiral and list (see §6).

> Answers are recorded in `docs/decisions.md`.

---

## 1. What we are building

A single-page portfolio with three movements, plus a project panel:

| Frame | Section | Inspired by | One-line behaviour |
| --- | --- | --- | --- |
| F | Intro | lukebaffait.fr | Dark page, slow ember glow, split name (sans + italic serif), thin footer bar |
| G | Reveal (first scroll) | lukebaffait.fr | The name halves slide apart and the replay demo grows between them |
| H | Projects: spiral | pacomepertant.com | 3D helix of project cards; scroll or drag to spin; front card is labelled with a Try it button |
| I | Projects: list | pacomepertant.com | Big centred titles; hover or focus floats a preview card |
| J | Project panel | pacomepertant.com | Near-full-screen rounded panel with its own URL; the demo runs inside |

**Inspiration, not copies.** Never copy code, assets, fonts, images, or text from either reference site. Take only the patterns described here. The colours, type, copy, and project content are Harsh's own.

### Non-negotiables carried over from CLAUDE.md

- The 60-second test: a recruiter can see a project working within 60 seconds, with no sign-up, install, or API key.
- No API keys, tokens, or secrets in front-end code, commits, or recordings.
- Synthetic or public demo data only. Nothing from Boldr, Accenture, client accounts, or internal tools.
- Recorded runs are always labelled `Recorded run · <date> · <model>`. Never present a replay as live.
- Framework-light: plain HTML, CSS, and JS (ES modules), plus the small libraries in §3. No build server; must run on GitHub Pages.
- Don't push, deploy, enable Pages, or change repo settings without Harsh confirming. Commits on a feature branch are fine.

### Changes from the references (deliberate, keep them)

- **No entry gate and no sound.** Pacôme's site asks "enter with/without sound"; we skip that, because it costs a click.
- **Fast path to work.** "Demos ↓" is visible on the first screen, the demo appears on the first scroll, and the whole intro plus reveal is at most ~1.5 viewport heights of scrolling before the projects section.
- **The list is the foundation; the spiral is an enhancement.** The list must work fully without JavaScript-driven 3D. It is the default on phones and with reduced motion.

---

## 2. Design tokens

Put these in `kit/css/tokens.css` as CSS custom properties. Every component uses tokens, never raw hex values.

### Colour (dark-first)

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#0B0A09` | Page ground |
| `--bg-deep` | `#050404` | Behind an open panel |
| `--surface` | `#14110F` | Panels, demo windows |
| `--surface-2` | `#16120F` | Active card |
| `--line` | `#2E2621` | Hairlines, borders |
| `--line-strong` | `#3A2E27` | Button borders |
| `--ink` | `#EDE8E3` | Primary text |
| `--ink-cool` | `#E6EEEA` | Italic serif surname (a slightly cooler white) |
| `--ink-2` | `#CFC7C0` | Body text on surfaces |
| `--muted` | `#A39A92` | Labels, meta text |
| `--dim` | `#6E655E` | Inactive list titles (large text only) |
| `--ember` | `#FF7A45` | Accent: links, active step, Try it |
| `--on-ember` | `#1A0F08` | Text on ember fills |
| `--glow-1` | `#FF6A2B` | Glow centre |
| `--glow-2` | `#D8321A` | Glow mid |
| `--glow-3` | `#5A120C` | Glow edge |

**Contrast rule:** body text must meet 4.5:1 and large text (24px+) 3:1. `--dim` is only allowed on the 46px list titles. Check `--muted` on `--surface` before using it for anything smaller than 12px.

**Light mode:** the site is dark-first by design. Still honour `prefers-color-scheme: light` with a warm light palette (`--bg #F4EFEA`, `--ink #1B1411`, `--ember #B4501F`, glow at about 35% opacity). Ask Harsh before spending time polishing it.

**Project card palettes** (spiral previews only; each card gets its own tint so the helix reads as a collection):

| Project | Card bg | Label colour |
| --- | --- | --- |
| ETL Triage Agent | `#16120F` | `#FF7A45` |
| Banking Transaction Platform | `#13202B` | `#9FC6E0` |
| LLM API Diagnostics Toolkit | `#2A1712` | `#F2B79C` |
| Bank Policy Assistant | `#10241D` | `#9FE0C4` |
| MCP Ticketing Server | `#1E1A2C` | `#B9AEE0` |
| LLM Usage and Cost Monitor | `#221C10` | `#E8D29A` |
| CineMatch | `#1B2230` | `#9FB3D9` |
| Supply Chain Audit Log | `#1F1622` | `#D7B9E0` |
| PyRedis | `#1A1A1A` | `#BDBDBD` |
| E-commerce Front End | `#1A1712` | `#E0CFA9` |

### Type

Self-host the fonts as `woff2` in `kit/fonts/` (all are SIL Open Font License; download from Google Fonts). Use `font-display: swap` with metric-matched fallbacks to avoid layout shift.

| Role | Family | Notes |
| --- | --- | --- |
| Display and UI | Instrument Sans 400/500/600 | Name, headings, list titles |
| Contrast italic | Instrument Serif Italic | Surname, emphasis words, the reveal line |
| Meta and data | JetBrains Mono 400/500 | Counters, labels, replay steps |

| Token | Desktop | Phone | Use |
| --- | --- | --- | --- |
| `--fs-name` | `clamp(72px, 13vw, 176px)` | | Split name |
| `--fs-reveal` | `clamp(28px, 3.4vw, 44px)` | | "Basically, I keep AI working." |
| `--fs-list` | `clamp(30px, 3.6vw, 46px)` | | Project list titles |
| `--fs-h2` | `clamp(36px, 4vw, 52px)` | | Panel title |
| `--fs-body` | `17px` | `16px` | Pitches |
| `--fs-ui` | `14px` | `14px` | Buttons, nav |
| `--fs-meta` | `11px` | `11px` | Mono labels (uppercase, `letter-spacing: 0.04em`) |

Name tracking: sans first name `-0.045em`; serif surname `-0.02em`.

### Space, radius, layers

- Spacing scale: 4, 8, 12, 16, 24, 28, 40, 48, 64, 96 px. Page gutter: 40px desktop, 16px phone.
- Radius: buttons are pills (`999px`); cards `12px`; the active card `14px`; panel `22px`; demo window `6px` in the reveal, `14px` in the panel.
- Background grid (projects section only): 1px lines at `#FFFFFF08` every 48px.
- Z-index layers: glow 0, content 10, section rail 20, header 30, panel 100, panel close 110.

### Motion tokens

| Token | Value |
| --- | --- |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--ease-inout` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--dur-fast` | `180ms` (hover, focus) |
| `--dur-med` | `420ms` (list preview, toggles) |
| `--dur-slow` | `700ms` (panel open and close) |
| Glow drift | 18–24s loop, transform only |

---

## 3. Stack

| Need | Choice | Why |
| --- | --- | --- |
| Scroll-linked animation | GSAP + ScrollTrigger | Proven, small, handles pinning. Confirm the current licence on gsap.com (it has been free for this kind of use). |
| Smooth scroll | Lenis | Small (MIT), syncs with ScrollTrigger |
| 3D spiral | **CSS 3D transforms** driven by JS | No WebGL in v1: lighter, sharper text, accessible DOM. Three.js is a possible later upgrade, not part of v1. |
| Card to panel morph | View Transitions API where supported; GSAP fallback | Native and cheap |
| Glow | CSS (blurred radial gradients, transform-only drift) | No canvas or shader in v1 |
| Project pages | One small Python script that writes static `/projects/<slug>/index.html` from `projects.json` | GitHub Pages has no server; Harsh is strongest in Python |

Vendor libraries into `kit/vendor/` with their licence files, pinned to exact versions. No CDN at runtime, no npm build step. A `package.json` is fine for dev-only tools (formatter, link checker).

**Performance budget (home page):** JS at most 120 KB gzipped, excluding fonts. LCP under 2.5s on a mid-range phone. CLS under 0.05. No long tasks over 200ms during scroll.

---

## 4. Repo structure (option A)

```
portfolio-ui/
├── kit/                         # shared, versioned, used by the site AND every project demo
│   ├── css/  tokens.css  base.css  components.css
│   ├── js/   replay-player.js  recorded-label.js  live-replay-switch.js
│   ├── fonts/
│   └── vendor/  gsap/  lenis/   (+ LICENSE files)
├── site/
│   ├── index.html               # F → G → H/I → notes → contact
│   ├── projects/<slug>/index.html   # generated, see §7
│   ├── notes/<slug>/index.html
│   ├── css/  site.css
│   ├── js/   main.js  glow.js  intro.js  reveal.js  projects-list.js  projects-spiral.js  panel.js  rail.js
│   └── data/ projects.json  replays/*.json
├── scripts/  build_project_pages.py
├── docs/     ui-spec.md (this file)  decisions.md
└── README.md
```

To run locally, Claude Code should give Harsh a command with a one-line explanation, for example `python3 -m http.server 8000 --directory site` ("serves the site folder at http://localhost:8000 so you can open it in a browser; nothing is deleted or installed").

---

## 5. Section specs

All sections use the same header (except the intro, which uses the footer bar) and the same section rail.

### F · Intro (first screen, `100svh`)

**Layout**
- Full-bleed `--bg` with three blurred glow blobs (see Glow below). Top-left: a two-line tagline at 14px, with one italic serif phrase.
- Name at the bottom, spread edge to edge: `Harsh` (Instrument Sans 500) on the left, `Keshruwala.` (Instrument Serif Italic, `--ink-cool`) on the right, baselines aligned. The `<h1>` holds the full name as one string for screen readers; the two halves are presentational spans.
- Footer bar 28px from the bottom, with a 1px top hairline at `--ink` 33% alpha. Left: `→ OPEN TO CUSTOMER ENGINEER ROLES · CANADA`. Centre: `GITHUB / LINKEDIN / RÉSUMÉ`. Right: `DEMOS ↓` (in ember), `NOTES`, `CONTACT`.

**Copy (approved)**
- Tagline: "Customer engineer, *fixing what breaks*, / for teams running AI and data platforms."

**Load sequence (total under 1.2s, never blocks interaction)**
1. 0ms: background and glow at 0 opacity; text present but transparent (no layout shift).
2. 0–600ms: glow fades in.
3. 150–750ms: name halves rise 24px and fade in, sans first, serif 80ms later.
4. 500–900ms: tagline and footer fade in.
- Skip the whole sequence when `prefers-reduced-motion` is set, or on repeat visits (`sessionStorage` flag, wrapped in try/catch).

**Glow**
- Three absolutely positioned circles with radial gradients `--glow-1 → --glow-2 → --glow-3 → transparent`, `filter: blur(60–70px)`, opacity 0.7–0.95. Positions: one large top-centre-right, one tall right, one small dim left (see frame F).
- Drift: each blob translates ±30px and scales 0.95–1.05 on an 18–24s loop with different phases. Transform and opacity only.
- Pause the drift when the tab is hidden or the intro is off-screen (IntersectionObserver). Freeze it under reduced motion.

### G · Reveal (pinned, ~120vh of scroll)

A GSAP ScrollTrigger timeline, scrubbed, with the intro pinned.

| Progress | What happens |
| --- | --- |
| 0 → 0.5 | The name halves translate apart: `Harsh` to about −30vw, `Keshruwala.` to about +30vw, both fading to 40% opacity. The tagline and footer fade out. |
| 0.1 → 0.6 | The demo window grows from the gap between the halves: `clip-path: inset()` from a 120×80 slit to 700×470 (desktop), with a slight scale (0.96 → 1). |
| 0.45 → 0.7 | The italic line "Basically, I keep AI working." fades in centred over the window, then fades out by 0.85. |
| 0.6 | The replay starts autoplaying (muted, no sound exists) once the window is at least 80% visible. It plays the `schema-drift` replay from `site/data/replays/`. |
| 1.0 | Unpin; the projects section scrolls in. |

- The demo window **is the real ReplayPlayer** (§8), not a picture. Visitors can pause it and change speed.
- The `Recorded run · <date> · <model>` label is always visible in the window header.
- A scroll counter `(NN)` at the left edge shows page progress as a two-digit percentage.
- **Phone (<768px) and reduced motion:** no pinning. Stack it as name → demo window (fully open) → italic line, with simple fade-ins.

### Section rail (from frame G onward)

- Fixed on the right edge, vertically centred: `Intro`, `Demos`, `Notes`, `Contact`. Each is a link with a 2px × 40px bar; the active bar is `--ink` and the rest `--line`.
- It is a `<nav aria-label="Sections">` of real links, updated with IntersectionObserver.
- Hidden below 1024px wide.

### Projects section (`#demos`)

**Header** (sticky inside the section): `hk.` monogram (serif italic) on the left; a centred view toggle `spiral • list` (a `role="group"` of two `<button aria-pressed>`); a `menu` pill on the right that opens a full-screen menu (a real dialog with a focus trap).

**Data:** render only projects with `"ready": true` in `projects.json`, featured tier first (see §6).

#### H · Spiral view (desktop default, progressive enhancement)

Geometry for card `i` of `n`:
```
theta_i = i * (360 / n) + rotation          // degrees
x_i     = R * sin(theta_i)                  // R ≈ 340px desktop
z_i     = R * cos(theta_i)
y_i     = (i - activeIndex) * pitch + yOffset   // pitch ≈ 90px, keeps the helix look
transform: translate3d(x_i, y_i, z_i) rotateY(theta_i) rotateZ(±3–6°)
```
- Container: `perspective: 1500px; transform-style: preserve-3d`.
- Card sizes: active 380×250; others 180–260 wide. Opacity falls with depth: `0.35 + 0.65 * (z_i + R) / (2R)`.
- **Input:** vertical scroll while the section is pinned (about 80vh per card); pointer drag left and right; arrow keys and PageUp/PageDown step one card; Home and End jump.
- **Snap:** when input stops, ease to the nearest card in `--dur-med` with `--ease-out`.
- **Active card:** the one with the largest `z`. Ember border at 40% alpha and an ember glow shadow `0 30px 120px -20px #FF6A2B66`.
- **Label pill** (bottom centre): a light pill (`--ink` bg, `--bg` text) with a 36px dark square showing the index `01`, the project title, and an ember `Try it` chip. The pill is the primary control: an `<a href="/projects/<slug>/">` that opens the panel. Announce changes with an `aria-live="polite"` region ("Project 1 of 10: ETL Triage Agent").
- Bottom left: `N PROJECTS · SCROLL OR DRAG TO SPIN`. Bottom right: `01 / N`.
- Cards are `aria-hidden` decoration except the active one. All real navigation goes through the pill, the list, or keyboard stepping.
- **Card previews are built in HTML/CSS, not images** (see the contents in §6), so they stay crisp in 3D and need no downloads. An Animos video clip can replace a preview later, but only lazily loaded with a still poster.

#### I · List view (phone default, no-JS and reduced-motion baseline)

- An ordered list of project titles centred, `--fs-list`, weight 500, tracking −0.025em. Inactive items are `--dim`; the hovered or focused item is `--ink`.
- The hovered or focused item gets a small mono superscript naming the skill it proves (for example `proof of concept`) in ember.
- **Floating preview:** on hover or focus, the item's preview card (the same component as the spiral card) appears, rotated −3°, offset right of the title, and follows the pointer with lerp smoothing. Fade and scale in at `--dur-med`. Hidden on touch devices.
- Hint at the bottom left: `FEATURED FIRST · HOVER TO PREVIEW · ENTER TO OPEN`.
- Every title is a real link to `/projects/<slug>/`.
- Remember the chosen view in `localStorage` (wrapped in try/catch). Default: spiral at ≥1024px with motion allowed; list otherwise.

### J · Project panel

- Opens from the pill, a list item, or a direct visit to `/projects/<slug>/`. It updates the URL with `history.pushState`; Back and Escape close it.
- **Visual:** `position: fixed; inset: 16px; border-radius: 22px; background: var(--surface)`; the page behind dims to `--bg-deep`. Close button: a 44px light circle with ×, top right, `aria-label="Close project"`.
- **Open motion:** a view transition from the card or list item to the panel (`view-transition-name: project-<slug>`). Fallback: the panel scales from 0.94 and fades in over `--dur-slow`. Reduced motion: a plain 150ms fade.
- **Accessibility:** a `<dialog>` opened with `showModal()`, focus moved to the title on open, focus trapped inside, and focus returned to the trigger on close.

**Left column (440px)** follows the project page template from CLAUDE.md:
1. Mono meta: `01 / 10 · /projects/<slug>`
2. Title: sans, with the last word in serif italic (for example "ETL Triage *Agent*")
3. Pitch: one plain-English sentence from `projects.json`
4. `PROVES` and `DEMO` rows (a `<dl>`)
5. Pill links at the bottom: `How it works` (architecture, quickstart, troubleshooting, limitations), `Source`, `90s video`

**Right column (the demo)**
- 2–3 scenario pills (`aria-pressed`). The panel opens with the scenario the 60-second path names (for the triage agent, **Schema drift**) and autoplays it.
- The ReplayPlayer, or for live-mode projects the live/replay switch from the kit.
- Below the player: `WHAT JUST HAPPENED ·` followed by three plain sentences, which update per scenario.
- Background: a faint ember radial gradient top-right.

**Phone:** the panel is full-screen (`inset: 0`, radius 0), the columns stack with the demo first, and the close button stays fixed.

---

## 6. Content

### `site/data/projects.json` schema

```json
{
  "slug": "etl-triage-agent",
  "title": "ETL Triage Agent",
  "titleItalicWord": "Agent",
  "tier": "featured",
  "ready": true,
  "pitch": "When a data pipeline breaks, it works out what broke and how serious it is, then alerts the right person with a suggested fix.",
  "proves": "Debugging and escalation",
  "demoMode": "replay",
  "demoLabel": "Recorded replay of a real run",
  "scenarios": [
    { "id": "clean-run", "label": "Clean run", "replay": "replays/etl-clean-run.json" },
    { "id": "schema-drift", "label": "Schema drift", "replay": "replays/etl-schema-drift.json", "default": true },
    { "id": "kafka-lag", "label": "Kafka lag", "replay": "replays/etl-kafka-lag.json" }
  ],
  "whatHappened": {
    "schema-drift": ["Sentence one.", "Sentence two.", "Sentence three."]
  },
  "links": { "source": "https://github.com/hpk369/ai-qa-agent", "video": null, "howItWorks": "..." },
  "card": { "bg": "#16120F", "label": "#FF7A45", "preview": "steps" }
}
```

- `ready` is the 60-second gate. Only `ready: true` projects render anywhere on the home page.
- `tier` order: featured, then supporting, then more. Order within a tier follows the plan.
- `demoMode`: `replay` | `live` | `static` | `simulation`. Simulations must say so in their label.
- Write `whatHappened` text with Harsh. Don't invent results or numbers (CLAUDE.md: every number needs a benchmark or eval).

### Card preview types (`card.preview`)

| Type | Project | What it shows (all synthetic) |
| --- | --- | --- |
| `steps` | ETL Triage Agent | 3 replay step lines and an ember `P1 · page on-call` chip |
| `bars` | Banking Transaction Platform | 6 bars, one in ember (the flagged transaction) |
| `code` | LLM API Diagnostics Toolkit | A large `429` in ember and a one-line fix |
| `chat` | Bank Policy Assistant | One answer bubble and a `source · <doc>` chip; use `[AMOUNT]` until real synthetic docs exist |
| `tools` | MCP Ticketing Server | 3 mono lines of tool calls and results |
| `line` | LLM Usage and Cost Monitor | A flat line with a spike labelled `spike · key-07` |
| `posters` | CineMatch | 4 tinted poster tiles |
| `chain` | Supply Chain Audit Log | 4 linked blocks, one broken |
| `terminal` | PyRedis | `> SET greeting hello` |
| `store` | E-commerce Front End | 3 product tiles and a cart badge |

### Approved copy

| Where | Text |
| --- | --- |
| Intro tagline | Customer engineer, *fixing what breaks*, for teams running AI and data platforms. |
| Intro footer left | → OPEN TO CUSTOMER ENGINEER ROLES · CANADA |
| Reveal line | *Basically, I keep AI working.* |
| Spiral hint | N PROJECTS · SCROLL OR DRAG TO SPIN |
| List hint | FEATURED FIRST · HOVER TO PREVIEW · ENTER TO OPEN |

Pitches come from the plan, word for word. Don't rewrite them without asking.

---

## 7. Deep links and static project pages

GitHub Pages can't route `/projects/<slug>/` to a single-page app on its own. Use `scripts/build_project_pages.py`:
- It reads `site/data/projects.json` and writes `site/projects/<slug>/index.html` for each `ready` project.
- Each page is a **complete, readable page on its own** (title, pitch, proves, demo, customer artifacts, links) with its own `<title>`, meta description, and Open Graph tags, so it works when shared on LinkedIn and without JavaScript.
- When `main.js` loads on such a page, it renders the home page behind it and shows the content as the panel.
- Commit the generated output, and add a note in the README on how to regenerate it.

---

## 8. Shared kit components (`/kit`)

Build these once; the site and every project demo use them.

| Component | Responsibility |
| --- | --- |
| `tokens.css` / `base.css` | §2 tokens, resets, focus ring (2px ember outline, 3px offset), `.sr-only`, reduced-motion guards |
| `ReplayPlayer` | Reads the replay JSON format in CLAUDE.md. Play/pause (44px), speed `0.5× / 1× / 2×`, progress bar, step list with the active step in ember, keyboard support (Space, ←/→ step). Emits `step` events so pages can react. Respects reduced motion by showing all steps instantly with a Play option. |
| `RecordedLabel` | `Recorded run · <date> · <model>`, from the replay JSON. Required whenever `source` is `recorded`. |
| `LiveReplaySwitch` | For live-mode projects: tries live with a few-second timeout, shows a "waking up" state, and falls back to replay with a visible note. Never holds a key. |
| `ProjectCard` | Renders a preview type from §6. Used by the spiral and the list hover preview. |
| `Pill`, `Button`, `IconButton` | 44px minimum targets, pill radius, ember variant |
| `Dialog` | Wrapper around `<dialog>` with focus trap and return |

Version the kit with git tags (`kit-v1.0.0`). Project demos load a pinned version, never "latest".

---

## 9. Accessibility checklist

- [ ] Every interactive element is a real `<a>`, `<button>`, or form control, reachable by Tab, with a visible focus ring.
- [ ] One `<h1>` (the full name); sections use `<h2>`.
- [ ] Decorative layers (glow, inactive spiral cards, background grid) are `aria-hidden="true"`.
- [ ] Spiral changes are announced through a polite live region.
- [ ] The panel is a modal `<dialog>`: focus moves in, is trapped, returns on close, and Escape closes it.
- [ ] `prefers-reduced-motion`: no pinning, no drift, no spinning, list view by default, instant transitions. Everything stays usable.
- [ ] Text contrast meets §2.
- [ ] Touch targets are at least 44px.
- [ ] The site works at 200% zoom and at 320px wide with no horizontal scroll.

---

## 10. Build phases for Claude Code

Work in this order. Each phase is a feature branch and a small PR. Stop at the end of each phase, summarise what changed in a few lines, and wait for Harsh before pushing.

| # | Phase | Done when |
| --- | --- | --- |
| 0 | **Setup.** Ask the §0 questions, scaffold §4, vendor GSAP and Lenis with licences, add the fonts, write the README run instructions. | `index.html` loads locally with tokens and fonts and no console errors. |
| 1 | **Kit foundations.** `tokens.css`, `base.css`, buttons and pills, `RecordedLabel`, `ReplayPlayer` with one synthetic `etl-schema-drift.json`. | The player runs the replay standalone, passes keyboard checks, and shows the label. |
| 2 | **Intro F.** Glow, split name, tagline, footer bar, load sequence, reduced-motion path. | Matches frame F at 1280×800; the name doesn't overflow at 1024, 768, or 375 wide. |
| 3 | **Reveal G.** Pinned timeline, the real player growing between the name halves, the reveal line, the scroll counter, the section rail. Phone stacking. | The demo autoplays on the first scroll; projects are reachable within ~1.5 viewport heights. |
| 4 | **Projects list I + data.** `projects.json`, the `ready` gate, the list, hover/focus previews, the view toggle (spiral disabled for now). | Fully keyboard-usable; works with JS animations off. |
| 5 | **Panel J + deep links.** Dialog, view transition, scenarios, "What just happened", `build_project_pages.py`, static pages. | `/projects/etl-triage-agent/` works on direct load, with Back/Escape, and without JS. |
| 6 | **Spiral H.** CSS 3D helix, scroll/drag/keys, snap, label pill, live region. | 60fps on a mid-range laptop; falls back to the list under reduced motion or below 1024px. |
| 7 | **Polish and checks.** Notes and contact sections, light-mode pass (ask first), §9 checklist, §3 budget (Lighthouse), link check, secrets check (`git grep` for key prefixes). | Passes the 60-second test in a private window on desktop and phone. |

Out of scope for v1 (note them in `docs/decisions.md`, don't build): WebGL/Three.js spiral, sound, cursor effects, the reticle motion cues from canvas row 6, and Animos video previews.

---

## 11. Definition of done (UI)

- [ ] A recruiter in a private window reaches a working demo in under 60 seconds on desktop and phone.
- [ ] Every replay shows `Recorded run · <date> · <model>`; nothing pretends to be live.
- [ ] No secrets in the repo; demo data is synthetic; recordings are scrubbed.
- [ ] Reduced motion, keyboard-only, and screen-reader passes are complete (§9).
- [ ] Performance budget met (§3).
- [ ] Every project card matches its README: same name, pitch, and stack.
- [ ] No code, assets, fonts, or copy taken from the reference sites.
