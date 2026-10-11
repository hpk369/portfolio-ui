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

**Open:** confirm that the AI QA Agent really is the ETL Triage Agent, or name the card it should be.

## Inputs the spec references but this repo doesn't have yet

- `CLAUDE.md` (portfolio rules, the replay JSON format, the project page template) and "Portfolio Project Plan — Customer Engineer" (pitches, word for word). Neither was in `hpk-website`. Until Harsh adds them, the replay format is a provisional one (documented in phase 1), and no pitch is invented: cards use the existing hpk-website descriptions only where Harsh approves.

## Build decisions

- **Local serving from the repo root.** The site references the kit as `../kit/...`, so serve the whole repo, not just `site/`: `python3 -m http.server 8000`, then open `http://localhost:8000/site/`. (The spec's example, `--directory site`, would hide `/kit`.)
- **Relative URLs everywhere.** On `hpk369.github.io` this repo is served under `/portfolio-ui/`, so root-absolute paths like `/projects/<slug>/` would break. All links are relative. How Pages publishes `site/` + `kit/` is decided at launch; Pages is not enabled.
- **Vendored versions:** GSAP 3.15.0 (`gsap.min.js`, `ScrollTrigger.min.js`) under GreenSock's standard no-charge licence (re-confirm on gsap.com before launch); Lenis 1.3.26 (`lenis.min.js`, MIT). About 52 KB gzipped together, leaving about 68 KB of the 120 KB budget for site code.
- **Fonts** come from the `@fontsource` npm packages (v5.3.0), which repackage the Google Fonts files with their OFL licence. Latin subset only: Instrument Sans 400/500/600, Instrument Serif Italic 400, JetBrains Mono 400/500. Fallbacks are metric-matched with `size-adjust` and ascent/descent overrides measured from the woff2 files.
- **`--fs-name` below 360px is `20vw`** (64px at 320) instead of the spec's 72px minimum. At 72px, "Keshruwala." is about 307px wide and causes horizontal scroll at 320px, which §9 forbids. Wider screens use the spec value unchanged.
- **Résumé link** points at the PDF already hosted on hpk-website until the résumé moves into this repo.

## Out of scope for v1 (don't build)

- WebGL / Three.js spiral
- Sound
- Cursor effects
- The reticle motion cues from canvas row 6
- Animos video previews
