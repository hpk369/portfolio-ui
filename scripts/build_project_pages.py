#!/usr/bin/env python3
"""Build the static project pages and the home page project list (spec §7).

Reads site/data/projects.json (and the replay JSON it points to) and writes:
  - site/projects/<slug>/index.html for every project with "ready": true. Each page
    is complete on its own: readable without JavaScript and shareable on LinkedIn.
    With JavaScript, it forwards to the home page, which opens the project as a panel.
  - the <ol class="plist"> items in site/index.html, between the
    "projects:list:start" and "projects:list:end" markers, so the list works without JS.

Run from the repo root:  python3 scripts/build_project_pages.py
Standard library only. Safe to re-run; it rewrites only the files above.
"""

from __future__ import annotations

import json
import re
import shutil
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
DATA = SITE / "data"
TIER_ORDER = {"featured": 0, "supporting": 1, "more": 2}
PLACEHOLDER = {
    "pitch": "[One-sentence pitch to come]",
    "proves": "[To come]",
}
TYPE_WIDTH = 11


def load_projects() -> list[dict]:
    projects = json.loads((DATA / "projects.json").read_text(encoding="utf-8"))
    ready = [p for p in projects if p.get("ready")]
    # Stable sort keeps the plan's order inside each tier.
    return sorted(ready, key=lambda p: TIER_ORDER.get(p["tier"], 9))


def title_html(project: dict) -> str:
    title, italic = project["title"], project.get("titleItalicWord")
    if italic and title.endswith(italic):
        head = title[: -len(italic)]
        return f'{escape(head)}<em class="em-muted">{escape(italic)}</em>'
    return escape(title)


def text_or_placeholder(value: str | None, key: str) -> str:
    if value:
        return escape(value)
    return f'<span class="is-placeholder">{escape(PLACEHOLDER[key])}</span>'


def rich(text: str) -> str:
    """Escape text and render `backtick` spans as <code>, like the JS player."""
    parts = escape(text).split("`")
    return "".join(f"<code>{p}</code>" if i % 2 else p for i, p in enumerate(parts))


def recorded_label(replay: dict) -> str:
    if replay["source"] == "recorded":
        return f'Recorded run · {replay["recorded_at"]} · {replay["model"]}'
    if replay["source"] == "synthetic":
        return "Sample replay · synthetic data · not a real run"
    raise ValueError(f'Replay {replay["id"]} has unknown source {replay["source"]!r}')


def payload_text(payload: dict | None) -> str:
    if not payload:
        return ""
    if payload.get("text"):
        return payload["text"]
    return " · ".join(f"{k}: {v}" for k, v in payload.items() if not isinstance(v, (dict, list)) and v is not None)


def replay_html(project: dict) -> str:
    blocks = []
    for scenario in project["scenarios"]:
        replay = json.loads((DATA / scenario["replay"]).read_text(encoding="utf-8"))
        steps = []
        for step in replay["steps"]:
            detail = payload_text(step.get("payload"))
            steps.append(
                '<li class="replay__step" data-type="{t}">'
                '<span class="replay__time">{s:.1f}s</span>'
                '<span class="replay__type">{t}</span>'
                '<span class="replay__label">{label}</span>{detail}</li>'.format(
                    t=escape(step["type"]),
                    s=step["t_ms"] / 1000,
                    label=rich(step["label"]),
                    detail=f'<span class="replay__detail">{rich(detail)}</span>' if detail else "",
                )
            )
        happened = project.get("whatHappened", {}).get(scenario["id"])
        happened_html = (
            f'<p class="what-happened"><span class="meta-label">What just happened · </span>{escape(" ".join(happened))}</p>'
            if happened
            else ""
        )
        blocks.append(
            f"""
      <section class="static-scenario" aria-labelledby="scenario-{escape(scenario['id'])}">
        <h3 id="scenario-{escape(scenario['id'])}">{escape(scenario['label'])}</h3>
        <div class="replay replay--static">
          <div class="replay__head"><p class="replay__title meta-label">{escape(replay['title'])}</p><p class="recorded-label meta-label">{escape(recorded_label(replay))}</p></div>
          <ol class="replay__steps">{''.join(steps)}</ol>
        </div>
        {happened_html}
      </section>"""
        )
    return "".join(blocks)


def demo_html(project: dict) -> str:
    mode = project["demoMode"]
    if mode == "replay":
        return replay_html(project)
    if mode == "embed":
        src = escape(project["embed"])
        return f"""
      <div class="embed">
        <iframe src="{src}" title="{escape(project['title'])} demo" loading="lazy"></iframe>
      </div>
      <p><a class="pill" href="{src}">Open the demo in a new tab ↗</a></p>"""
    existing = project["links"].get("existingDemo")
    existing_html = (
        f'<p><a class="pill" href="{escape(existing)}">See the current demo ↗</a></p>' if existing else ""
    )
    return f"""
      <div class="demo-placeholder">
        <p class="demo-placeholder__title">Demo coming soon</p>
        <p class="meta-label">This project is being rebuilt so you can try it in under a minute.</p>
      </div>{existing_html}"""


def links_html(project: dict) -> str:
    links = project["links"]
    items = [
        ("How it works", links.get("howItWorks")),
        ("Source", links.get("source")),
        ("90s video", links.get("video")),
    ]
    out = []
    for label, href in items:
        if href:
            out.append(f'<a class="pill" href="{escape(href)}">{label}</a>')
        else:
            out.append(f'<span class="pill is-disabled" aria-disabled="true">{label} <span class="is-placeholder">· to come</span></span>')
    return "\n        ".join(out)


def page_html(project: dict, index: int, total: int) -> str:
    slug = project["slug"]
    pitch = project.get("pitch") or f'{project["title"]}: a project by Harsh Keshruwala.'
    demo_label = project.get("demoLabel") or "Coming soon"
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(project['title'])} · Harsh Keshruwala</title>
  <meta name="description" content="{escape(pitch)}">
  <meta name="color-scheme" content="dark light">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{escape(project['title'])} · Harsh Keshruwala">
  <meta property="og:description" content="{escape(pitch)}">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230A0A0A'/%3E%3Ctext x='5' y='22' font-family='Arial,sans-serif' font-weight='700' font-size='17' letter-spacing='-1' fill='%23F0F0F0'%3Ehk%3Ctspan fill='%23FF1E00'%3E.%3C/tspan%3E%3C/text%3E%3C/svg%3E">
  <!-- With JavaScript, show this project as a panel over the home page. -->
  <script>location.replace('../../?project={escape(slug)}' + location.hash);</script>
  <link rel="stylesheet" href="../../../kit/css/tokens.css">
  <link rel="stylesheet" href="../../../kit/css/base.css">
  <link rel="stylesheet" href="../../../kit/css/components.css">
  <link rel="stylesheet" href="../../css/site.css">
</head>
<body class="project-page">
  <header class="project-page__head">
    <a class="projects__mono" href="../../">hk<span class="accent-dot">.</span></a>
    <a class="pill" href="../../#demos">← All projects</a>
  </header>
  <main class="project-page__main">
    <p class="meta-label project-page__meta">{index:02d} / {total:02d} · /projects/{escape(slug)}</p>
    <h1 class="project-page__title">{title_html(project)}</h1>
    <p class="project-page__pitch">{text_or_placeholder(project.get('pitch'), 'pitch')}</p>
    <dl class="facts">
      <div><dt class="meta-label">Proves</dt><dd>{text_or_placeholder(project.get('proves'), 'proves')}</dd></div>
      <div><dt class="meta-label">Demo</dt><dd>{escape(demo_label)}</dd></div>
    </dl>

    <section class="project-page__section" aria-labelledby="try-it">
      <h2 id="try-it" class="project-page__h2">Try it</h2>{demo_html(project)}
    </section>

    <section class="project-page__section" aria-labelledby="artifacts">
      <h2 id="artifacts" class="project-page__h2">Customer artifacts</h2>
      <ul class="artifacts">
        <li>Architecture diagram <span class="is-placeholder">· to come</span></li>
        <li>Quickstart <span class="is-placeholder">· to come</span></li>
        <li>Troubleshooting guide <span class="is-placeholder">· to come</span></li>
        <li>Known limitations <span class="is-placeholder">· to come</span></li>
      </ul>
    </section>

    <nav class="project-page__links" aria-label="Project links">
        {links_html(project)}
    </nav>
  </main>
</body>
</html>
"""


def list_html(projects: list[dict]) -> str:
    items = []
    for p in projects:
        proves = f'<sup class="plist__proves meta-label">{escape(p["proves"])}</sup>' if p.get("proves") else ""
        items.append(
            f'          <li class="plist__item"><a class="plist__link" href="projects/{escape(p["slug"])}/" '
            f'data-slug="{escape(p["slug"])}"><span class="plist__title">{escape(p["title"])}</span>{proves}</a></li>'
        )
    return "\n".join(items)


def main() -> None:
    projects = load_projects()
    out_dir = SITE / "projects"
    # Remove pages for projects that are no longer listed, then rebuild all.
    if out_dir.exists():
        for child in out_dir.iterdir():
            if child.is_dir():
                shutil.rmtree(child)
    for i, project in enumerate(projects, start=1):
        target = out_dir / project["slug"] / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(page_html(project, i, len(projects)), encoding="utf-8")

    index_path = SITE / "index.html"
    index = index_path.read_text(encoding="utf-8")
    pattern = re.compile(r"(<!-- projects:list:start[^>]*-->\n).*?(<!-- projects:list:end -->)", re.S)
    if not pattern.search(index):
        raise SystemExit("site/index.html is missing the projects:list markers")
    index = pattern.sub(lambda m: m.group(1) + list_html(projects) + "\n" + m.group(2), index)
    index_path.write_text(index, encoding="utf-8")

    print(f"Wrote {len(projects)} project pages and the home page list.")


if __name__ == "__main__":
    main()
