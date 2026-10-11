# portfolio-ui

Harsh Keshruwala's portfolio site ("Ember") and the shared UI kit that the site and every project demo use.

- **`kit/`**: shared, versioned CSS, JS, fonts, and vendored libraries. Project demos load a pinned tag (`kit-vX.Y.Z`), never "latest".
- **`site/`**: the portfolio itself: plain HTML, CSS, and ES modules, with no build step. It runs on GitHub Pages.
- **`docs/`**: [`ui-spec.md`](docs/ui-spec.md) (the build spec) and [`decisions.md`](docs/decisions.md) (choices made along the way).

## Run it locally

From the repo root:

```bash
python3 -m http.server 8000
```

This serves the repo folder at http://localhost:8000. Nothing is deleted or installed. Open **http://localhost:8000/site/** in a browser.

Serve the repo root, not `site/`, because the site loads the kit from `../kit/`.

## Layout

```
kit/
  css/     tokens.css (design tokens), base.css (fonts, reset, focus ring, utilities)
  js/      shared components (ReplayPlayer, RecordedLabel, ...), from phase 1
  fonts/   self-hosted woff2 + OFL licences
  vendor/  gsap 3.15.0, lenis 1.3.26 (+ licences)
site/
  index.html, css/, js/, data/ (projects.json, replays/), projects/ (generated), notes/
scripts/   build_project_pages.py (phase 5)
docs/      ui-spec.md, decisions.md
```

## Rules this repo keeps

- No API keys, tokens, or secrets anywhere: code, commits, or recordings.
- Demo data is synthetic or public only.
- Recorded runs are always labelled `Recorded run · <date> · <model>`.
- Vendored libraries are pinned to exact versions and committed with their licence files. No CDN at runtime.

## Credits

Fonts: Instrument Sans and Instrument Serif (The Instrument Sans Project Authors), JetBrains Mono (The JetBrains Mono Project Authors), all under the SIL Open Font License 1.1. Motion: GSAP (GreenSock) and Lenis (darkroom.engineering).
