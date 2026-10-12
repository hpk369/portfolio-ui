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

## Content and replays (Oct 11, after CLAUDE.md arrived)

- `CLAUDE.md` is now in the repo root and is the source of truth for rules, pitches, tiers and the replay format.
- **All ten projects are listed, with visible placeholders** (Harsh: "put placeholders for any missing project"). This knowingly overrides CLAUDE.md's "a project that fails the 60-second test is not listed" until launch. Before launch, set `"ready": false` on anything that still fails the test and re-run `scripts/build_project_pages.py`.
- In `projects.json`, a `null` field renders as a placeholder (`[One-sentence pitch to come]`, `[To come]`, `· to come`). `"placeholder": true` marks projects still waiting on Harsh's details.
- Pitches are copied word for word from CLAUDE.md. CineMatch, Supply Chain Audit Log, PyRedis and E-commerce Front End have no pitch there yet, so they show a placeholder. "Proves" is filled only where a source gives it: ETL Triage Agent (spec) and Bank Policy Assistant (frame I).
- Tier order follows CLAUDE.md's repo table: featured (ETL, Banking, Diagnostics, Bank Policy), supporting (MCP, Usage Monitor, CineMatch), more (Supply Chain, PyRedis, E-commerce).
- Replays use CLAUDE.md's JSON shape. The three ETL replays (clean run, schema drift, Kafka lag) are **synthetic** (`"source": "synthetic"`) and labelled "Sample replay · synthetic data · not a real run". Harsh: skip recording a real run of the AI QA agent for now.
- Demo modes in use: `replay` (ETL), `embed` (CineMatch, its existing static demo in an iframe), and `placeholder` (everything else; links to an existing demo where one exists). `embed` and `placeholder` are additions to the spec's enum.
- The banking demo link is kept as "See the current demo" even though CLAUDE.md notes it may show "Connecting…"; verify before launch.

## Build decisions

- **Local serving from the repo root.** The site references the kit as `../kit/...`, so serve the whole repo, not just `site/`: `python3 -m http.server 8000`, then open `http://localhost:8000/site/`. (The spec's example, `--directory site`, would hide `/kit`.)
- **Deep links:** each `site/projects/<slug>/index.html` is a complete static page. With JS it forwards to `../../?project=<slug>`, and the home page opens the panel and restores the `/projects/<slug>/` address. JS builds absolute project URLs from `site/js/env.js`, so links keep working after `pushState`.
- **Spiral:** the page scroll is the only state. The section pins for 80vh per card; drag, arrow keys and snap all move the scroll. Cards wrap around the ring and fade at the seam, so the helix reads on both sides of the active card.
- **Not built yet:** `LiveReplaySwitch` (no project has a live backend yet), the kit version tag `kit-v1.0.0` (tagging is a push; ask first), the light-mode polish pass, and a Lighthouse budget run.
- **Relative URLs everywhere.** On `hpk369.github.io` this repo is served under `/portfolio-ui/`, so root-absolute paths like `/projects/<slug>/` would break. All links are relative. How Pages publishes `site/` + `kit/` is decided at launch; Pages is not enabled.
- **Vendored versions:** GSAP 3.15.0 (`gsap.min.js`, `ScrollTrigger.min.js`) under GreenSock's standard no-charge licence (re-confirm on gsap.com before launch); Lenis 1.3.26 (`lenis.min.js`, MIT). About 52 KB gzipped together, leaving about 68 KB of the 120 KB budget for site code.
- **Fonts** come from the `@fontsource` npm packages (v5.3.0), which repackage the Google Fonts files with their OFL licence. Latin subset only: Instrument Sans 400/500/600, Instrument Serif Italic 400, JetBrains Mono 400/500. Fallbacks are metric-matched with `size-adjust` and ascent/descent overrides measured from the woff2 files.
- **`--fs-name` below 360px is `20vw`** (64px at 320) instead of the spec's 72px minimum. At 72px, "Keshruwala." is about 307px wide and causes horizontal scroll at 320px, which §9 forbids. Wider screens use the spec value unchanged.
- **Résumé link** points at the PDF already hosted on hpk-website until the résumé moves into this repo.

## Design changes from Harsh

- **Oct 11: whole name in Instrument Serif Italic.** Harsh asked for the first name to use the surname's font, so "Harsh Keshruwala." is set entirely in the serif italic (`--ink-cool`, `-0.02em` tracking). This replaces the spec's sans/serif split (§2, §5 F).

## Contrast (checked Oct 11)

Dark mode passes everywhere it's used: `--muted` on `--surface` 6.8:1, `--ink-2` on `--surface` 11.3:1, `--ember` on `--surface` 7.3:1, `--on-ember` on `--ember` 7.3:1, `--dim` on `--bg` 3.5:1 (large list titles only). **Light mode:** the spec's `--ember #B4501F` on `--bg #F4EFEA` is 4.47:1, just under 4.5:1 for body text. Fine for large text; revisit in the light-mode pass.

## Mono direction (Oct 12, 2026)

Harsh supplied a `DESIGN.md` reference (measured tokens from lukebaffait.fr, the same site that inspired frames F and G) and asked to recreate the portfolio with it. Only the measured tokens were taken: no code, assets, fonts, images or copy from that site. Layout, behaviour, content and accessibility rules are unchanged.

| Area | Ember (before) | Mono (now) |
| --- | --- | --- |
| Ground | warm `#0B0A09` | `#0A0A0A`, surfaces `#111` / `#161616` |
| Text | warm off-whites | `#F0F0F0` headings; white at 80% (body), 50% (meta), 35% (inactive list titles only) |
| Accent | ember `#FF7A45` | red `#FF1E00` (light mode `#D41900`). Token names `--ember`, `--glow-*` kept so kit consumers don't break |
| Type | Instrument Sans + Instrument Serif Italic + JetBrains Mono | **Inter** (variable, 400–700) for everything; JetBrains Mono only for replay steps and card code. Headings 700 with tight tracking |
| Name | serif italic (Oct 11 decision) | **Inter 700**, with a red full stop. Replaces the Oct 11 serif-italic name |
| Emphasis | italic serif words | same face in muted white (`.em-muted`) |
| Meta labels | JetBrains Mono caps | Inter 500 caps (`.meta-label`, renamed from `.mono-meta`) |
| Corners | pills, 6–22px radii | square everywhere (no radii observed) |
| Shadows | glow shadows on cards and windows | none (none observed); the active spiral card gets a solid red border |
| Motion | 180 / 420 / 700ms, ease-out | 600ms `cubic-bezier(0.87, 0, 0.13, 1)` for state changes; 300ms `ease` for hovers; links get an underline wipe |
| Spacing | 40px gutter | 64px gutter (32px under 1200px, 16px on phones); section ends `clamp(96px, 17vw, 214px)` |
| Project cards | one tint per project | neutral greys; red is the only colour |

Deviations from the measured values, on purpose:
- **Breton** (the reference body face) is a commercial font, so Inter is used for body text as well.
- **Meta text is 50% white, not 45%.** 45% on `#0A0A0A` is 4.48:1, just under 4.5:1; 50% gives 5.3:1 on the ground and 5.0:1 on `--surface`.
- **Inactive list titles are 35% white, not 20%.** 20% is about 1.9:1; 35% clears 3:1 for large text.
- **Text on red is near-black**, not white: white on `#FF1E00` is 3.9:1, `#0A0A0A` on it is 5.1:1.
- The reference is dark only; light mode is kept (CLAUDE.md asks for dark mode, and the site already honoured `prefers-color-scheme`).

Fonts: Inter 4.x latin variable woff2 from `@fontsource-variable/inter` 5.2.8 (OFL, licence in `kit/fonts/`). The Instrument Sans / Serif files were removed.

## About, Projects and Gallery flow (Oct 12, 2026)

Harsh asked for an About section after the intro, and for the Projects and Gallery sections to follow the flow of the reference site (from his screen recording; the site itself is blocked from the build environment). Only the interaction pattern was taken: no code, images or copy.

- **About** follows the intro and reuses the hpk-website About text word for word (Harsh's choice). It still says "application support professional"; CLAUDE.md wants Customer Engineer positioning, so this needs a rewrite before launch.
- **Projects replace the spiral and list views.** Titles scroll on the left; the one in the middle of the screen turns white and its preview shows in a sticky frame on the right, wiping in on the signature curve. A thick red ribbon behind the list draws itself as you scroll. Phones, reduced motion and no-JS get a stacked list with every image inline. `projects-spiral.js` and `projects-list.js` are removed, as are the view toggle and the `hk-projects-view` storage key.
- **Every project image carries a demo link** in its top-left corner: "Try the demo" opens the panel when the demo runs there (replay, embed); "Open the demo ↗" goes to an existing external demo; otherwise "Demo · coming soon" opens the project page.
- **Gallery** (new, after Projects): pinned for ~4 screens on wide screens with motion. The project images ride a vertical spiral around the line in the middle: scrolling turns the spiral about 1¼ times and lifts it from the bottom of the screen to the top, with cards dim and small at the back, edge-on at the sides, and brighter in front, while the line reveals word by word. The 10 projects repeat to make 20 cards; the repeats are `aria-hidden` and inert. Each image keeps a small demo link. Phones and reduced motion get a grid. (Oct 12: changed from a straight fly-through to the spiral, at Harsh's request, to match the recording.)
- **Gallery line is new copy and needs Harsh's approval:** "Every project starts as a problem a customer could hit. I build it, break it, and write down the fix."
- **Images** come from the GIFs already on hpk-website, converted to a WebP poster plus a muted 10s MP4 loop (`site/media/`, about 1.7 MB total versus 28 MB of GIFs). Clips load only when their preview is shown, and never under reduced motion. Not reused: the e-commerce GIF (shows the "Nike" brand, which CLAUDE.md forbids) and the PyRedis GIF (a "Redis" wordmark); those two, and the four projects without images, use the HTML preview cards. **Open question:** where those GIFs came from. If they are third-party animations, they need a licence check or replacing with real screenshots before launch.
- The fixed logo and menu header moved out of the projects section and now shows from the first scroll on every section.

## Work page (Oct 12, 2026)

Harsh asked for a Work section after the reference's Work page (screen recording plus a measured `DESIGN_Work.md`). Only the interaction pattern and measured tokens were taken: no code, images or copy.

- **A separate page, `site/work/`**, as in the recording: "Work" in the intro bar and the menu fades the home page to black, then the Work page opens with its title first and the window after. "Back" fades out and returns home, which fades in. Reduced motion skips both fades.
- **The drum.** One rounded window (radius up to 140px) holds a four-sided drum; each project is a face, image on the left and a text panel on the right. One wheel gesture, arrow key, Page Down or the chevron turns it a quarter turn: the current project tips away at the top while the next rolls up from below. Scroll snapping keeps it on one project; a wheel handler stops a trackpad's inertia from skipping several. Tabbing into another slide turns the drum to it, and `work/#<slug>` opens on that project.
- **WebGL (Oct 12, Harsh: "go ahead and use the WebGL").** `site/js/work-gl.js` draws the drum in raw WebGL (no library). Every pixel is ray-cast against a cylinder that turns about a horizontal axis, seen close up (radius 0.87 × and camera 2.09 × the window height, fitted to the recording), so slides narrow towards their top and bottom and curve away as they turn. Each slide is cut to a lens shape: straight top and bottom, sides curving in over the whole height (11% of the width at the ends). A gauge ring with a tick every 1.25° (a long one every 25°) runs round the cylinder near the screen edges and turns with it. The text panel alternates sides, as in the reference, and images are fitted inside the image area with room round them rather than cropped to fill it. The text layer is painted with the 2D canvas API from the HTML slide; the real HTML links sit over it and hide while the drum turns, and the rest of the HTML stays in the page, invisible, for screen readers and keyboard use. Projects without an image show a plain "Preview to come" tile. Without WebGL, or if the GPU context is lost, the CSS 3D drum takes over (it alternates sides too). This replaces the "WebGL / Three.js spiral" exclusion below for the Work page only.
- **Phones, reduced motion and no-JS** get a stacked list of the same slides.
- **Measured tokens used:** 12% white hairlines, 50px pill radius, the signature curve at 0.6s and `ease` at 0.3s.
- **Slide content (Harsh, Oct 12):** no category label and no year line. Stack shows "Stack · to come" on every project for now; the `kind` and `stack` fields were removed from `projects.json`.

## 3D intro background and full-screen reel (Oct 12, 2026)

Harsh asked for the intro to follow a second screen recording of the reference site: a uniform, 3D-looking background that reacts to the cursor, and a reel that grows to fill the screen on scroll and then fades into the next section. Only the interaction pattern was taken: no code, video or images.

- **Background (`site/js/glow.js`) is now WebGL.** A fragment shader draws slow, domain-warped noise across the whole first screen, shades it like a soft surface (normals from the height field, light from the cursor), and maps it onto the `--bg` / `--glow-*` tokens, so light and dark mode both work. The cursor swirls the field around it with eased follow; with no pointer (touch, idle) the light wanders on its own. It renders at half resolution and pauses off-screen, in hidden tabs, and while the reel covers it. Reduced motion draws one still frame. If WebGL or the shader fails, the CSS blobs stay. This overrides the spec's "no canvas or shader in v1" and "cursor effects: out of scope" at Harsh's request.
- **The reveal shows a video, not the replay player.** `site/media/intro-reel.mp4` (1.3 MB, 8 s seamless loop, 1280×720, no audio) and its poster are rendered from a shader in this repo (`scripts/intro-reel/`), so there are no third-party assets. It is decorative, `aria-hidden`, and captioned "Rendered loop · not a project demo". The ETL demo stays one click away: a "Try the ETL Triage Agent demo →" button sits over the reel and opens the project panel.
- **Reveal timeline (desktop with motion, pinned for 240% of the screen; the reel starts darkening at 58% of it):** the name lifts to the middle; the reel opens as a thumbnail between the halves (or behind the name when it wraps onto two lines); the halves slide off-screen as the reel grows to full screen; the line and the demo button show over it; then the reel darkens from the bottom up into the page colour, which hands over to About. Phones and reduced motion keep the unpinned stack (reel, line, button); the reel plays only while on screen and never under reduced motion.
- **About** loses its top border so the hand-over is seamless. On desktop it rides up over the last stretch of the pinned intro (`margin-top: -55svh`, see-through top) while the reel darkens, so there is no blank black screen between them (Oct 12 follow-up). A **photo placeholder** sits behind the text on the right, as in the recording: a red-tinted, blurred panel labelled "Photo · to come". To add the photo, put it at `site/media/about.webp` and swap the placeholder span for the `<img>` shown in the HTML comment; CSS blurs, greys and tints it. It rises and fades in as the section scrolls in, and the lead sharpens word by word (blurred and faint → crisp), driven by scroll. Reduced motion and no-JS see plain text.
- `splitWords` moved from `gallery.js` to `site/js/words.js` so Gallery and About share it.

To re-render the reel: `cd scripts/intro-reel && npm i playwright-core@1.56.0 && node render.mjs "$PWD/reel.html" frames 240`, then `ffmpeg -framerate 30 -i frames/f%04d.png -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart -an ../../site/media/intro-reel.mp4`.

### Follow-up: About layout and hand-overs between every section (Oct 12, 2026)

- **About text trimmed** (Harsh: "reduce the text"). The lead and one short line remain, both cut down from the hpk-website text with no new claims: "Hello! I'm an application support professional focused on incident resolution, system monitoring, and keeping critical systems reliable." and "I handle everything from single-user issues to company-wide outages, using DataDog, Salesforce, SQL, and Python." It still needs the Customer Engineer rewrite before launch.
- **No text over the photo.** About is two columns: text on the left, the photo placeholder in its own column on the right (4:5, up to 78% of the screen height). On phones the photo stacks under the text.
- **Every section hands over like intro → About** (`site/js/transitions.js`, replacing `about.js`): the outgoing section darkens from the bottom up into the page colour as the next one arrives (a shade over its last screen, fully dark once its bottom is 45% up the screen); every section title, and any `[data-words]` text, sharpens word by word from faint and blurred to crisp; `[data-rise]` media lifts and fades in. The hairline borders between sections are gone so the hand-overs are seamless. All scroll-driven; reduced motion and no-JS see the sections unchanged. The Gallery line keeps its own word reveal. The separate Work page is not part of this.

## Out of scope for v1 (don't build)

- WebGL / Three.js spiral (exceptions at Harsh's request: the Work page drum, and the intro background since Oct 12; the spiral stays CSS 3D)
- Sound
- Cursor effects (except the intro background, Oct 12)
- The reticle motion cues from canvas row 6
- Animos video previews
