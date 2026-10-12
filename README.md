# portfolio-ui

Harsh Keshruwala's portfolio site ("Mono" direction, formerly "Ember") and the shared UI kit that the site and every project demo use.

- **`kit/`**: shared, versioned CSS, JS, fonts, and vendored libraries. Project demos load a pinned tag (`kit-vX.Y.Z`), never "latest".
- **`site/`**: the portfolio itself: plain HTML, CSS, and ES modules, with no build step. It runs on GitHub Pages.
- **`CLAUDE.md`**: rules for working on the portfolio and its demos.
- **`docs/`**: [`ui-spec.md`](docs/ui-spec.md) (the build spec) and [`decisions.md`](docs/decisions.md) (choices made along the way).

## Run it locally

From the repo root:

```bash
python3 -m http.server 8000
```

This serves the repo folder at http://localhost:8000. Nothing is deleted or installed. Open **http://localhost:8000/site/** in a browser.

Serve the repo root, not `site/`, because the site loads the kit from `../kit/`.

## Edit projects

Project content lives in `site/data/projects.json` (pitch, tier, demo, links, card colours) and replays in `site/data/replays/`. After any change, regenerate the static project pages and the home page list:

```bash
python3 scripts/build_project_pages.py
```

This rewrites `site/projects/*/index.html` and the Projects and Gallery items inside `site/index.html`. It uses only the Python standard library and touches nothing else. Commit the output.

A field set to `null` shows as a placeholder on the site. Set `"ready": false` to hide a project everywhere.

## Layout

```
kit/
  css/     tokens.css (design tokens), base.css (fonts, reset, focus ring, utilities), components.css
  js/      replay-player.js, recorded-label.js, project-card.js, dialog.js
  examples/  replay-player.html (standalone player check)
  fonts/   self-hosted woff2 + OFL licences
  vendor/  gsap 3.15.0, lenis 1.3.26 (+ licences)
site/
  index.html, css/, js/, data/ (projects.json, replays/), media/ (project posters + clips), projects/ (generated)
scripts/   build_project_pages.py
docs/      ui-spec.md, decisions.md
```

## Rules this repo keeps

- No API keys, tokens, or secrets anywhere: code, commits, or recordings.
- Demo data is synthetic or public only.
- Recorded runs are always labelled `Recorded run · <date> · <model>`.
- Vendored libraries are pinned to exact versions and committed with their licence files. No CDN at runtime.

## Credits

Fonts: Inter (The Inter Project Authors) and JetBrains Mono (The JetBrains Mono Project Authors), both under the SIL Open Font License 1.1. Motion: GSAP (GreenSock) and Lenis (darkroom.engineering).
