# Decisions

A running log of choices made while building the Ember portfolio. Newest at the bottom of each section.

## §0 answers (Oct 11, 2026)

| Question | Answer |
| --- | --- |
| Repo name and shape | **Option A.** One repo, `hpk369/portfolio-ui`, holding `/kit` and `/site`. `hpk369/hpk-website` stays live, untouched, until launch. |
| Demo domain | **`hpk369.github.io`** |
| E-commerce store name | Not chosen yet. Use **"E-commerce Front End"**. |
| Ready projects (60-second gate) | **Only the projects on the current hpk-website portfolio.** See the mapping below. Everything else is `ready: false`. |

### Ready-project mapping (current site → spec card)

| Current hpk-website project | Spec card |
| --- | --- |
| AI Agent QA Pipeline: n8n + Robot Framework + pytest (`hpk369/ai-qa-agent`) | ETL Triage Agent (the spec's source link points to the same repo) |
| Banking Transaction Processing Platform with Kafka & Spark Streaming | Banking Transaction Platform |
| Movie Recommendation System using Hadoop | CineMatch |
| Blockchain-based Supply Chain Tracker | Supply Chain Audit Log |
| PyRedis: Lightweight In-Memory Key-Value Store | PyRedis |
| Amazon Clone E-Commerce Web Application | E-commerce Front End |

Not on the current site, so `ready: false` for now: LLM API Diagnostics Toolkit, Bank Policy Assistant, MCP Ticketing Server, LLM Usage and Cost Monitor.

**Content source (Harsh, Oct 11):** use the projects on https://hpk369.github.io/hpk-website/ for now; Harsh will add the new projects as they're finished. Titles, descriptions, tech and links come from that page, not invented.

Known gaps on the current site, to fix before launch:
- PyRedis "View Demo" points at `video_demos/supply_chain_blk_demo.mov` (the supply chain video, and the file isn't in the repo).
- Amazon Clone "View Demo" is `#`.
- Until those exist, both cards use their existing GIF as a `static` demo.

## Inputs the spec references but this repo doesn't have yet

- `CLAUDE.md` (portfolio rules, the replay JSON format, the project page template) and "Portfolio Project Plan — Customer Engineer" (pitches, word for word). Neither was in `hpk-website`. Until Harsh adds them, the replay format is a provisional one (documented in phase 1), and no pitch is invented: cards use the existing hpk-website descriptions only where Harsh approves.

## Replays

- `CLAUDE.md` isn't available yet, so the replay JSON uses a provisional format, `replay/v0`, documented in `kit/js/replay-player.js`. Swap it for the CLAUDE.md format when that arrives.
- The phase 1 fixture `etl-schema-drift.json` is **synthetic**: hand-written, not a recording. A replay's `source` is either `recorded` or `synthetic`. Recorded replays show `Recorded run · <date> · <model>`. Synthetic ones show `Sample replay · synthetic data · not a real run`, so nothing poses as a recording. Replace it with a real scrubbed recording of the AI QA agent when one exists.

## Build decisions

- **Local serving from the repo root.** The site references the kit as `../kit/...`, so serve the whole repo, not just `site/`: `python3 -m http.server 8000`, then open `http://localhost:8000/site/`. (The spec's example, `--directory site`, would hide `/kit`.)
- **Relative URLs everywhere.** On `hpk369.github.io` this repo is served under `/portfolio-ui/`, so root-absolute paths like `/projects/<slug>/` would break. All links are relative. How Pages publishes `site/` + `kit/` is decided at launch; Pages is not enabled.
- **Vendored versions:** GSAP 3.15.0 (`gsap.min.js`, `ScrollTrigger.min.js`) under GreenSock's standard no-charge licence (re-confirm on gsap.com before launch); Lenis 1.3.26 (`lenis.min.js`, MIT). About 52 KB gzipped together, leaving about 68 KB of the 120 KB budget for site code.
- **Fonts** come from the `@fontsource` npm packages (v5.3.0), which repackage the Google Fonts files with their OFL licence. Latin subset only: Instrument Sans 400/500/600, Instrument Serif Italic 400, JetBrains Mono 400/500. Fallbacks are metric-matched with `size-adjust` and ascent/descent overrides measured from the woff2 files.
- **`--fs-name` below 360px is `20vw`** (64px at 320) instead of the spec's 72px minimum. At 72px, "Keshruwala." is about 307px wide and causes horizontal scroll at 320px, which §9 forbids. Wider screens use the spec value unchanged.
- **Résumé link** points at the PDF already hosted on hpk-website until the résumé moves into this repo.

## Contrast (checked Oct 11)

Dark mode passes everywhere it's used: `--muted` on `--surface` 6.8:1, `--ink-2` on `--surface` 11.3:1, `--ember` on `--surface` 7.3:1, `--on-ember` on `--ember` 7.3:1, `--dim` on `--bg` 3.5:1 (large list titles only). **Light mode:** the spec's `--ember #B4501F` on `--bg #F4EFEA` is 4.47:1, just under 4.5:1 for body text. Fine for large text; revisit in the light-mode pass.

## Out of scope for v1 (don't build)

- WebGL / Three.js spiral
- Sound
- Cursor effects
- The reticle motion cues from canvas row 6
- Animos video previews
