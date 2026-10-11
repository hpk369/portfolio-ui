# CLAUDE.md — Harsh Keshruwala Portfolio (Customer Engineer focus)

This file tells Claude Code how to work on Harsh's portfolio and its project demos.
Source of truth for scope and priorities: the "Portfolio Project Plan — Customer Engineer" doc.
If this file and the plan disagree, ask Harsh before acting.

## Goal

The portfolio targets **Technical Customer Engineer roles in Canada** (post-sales, AI and data platforms).
Every project must prove one customer-facing skill: integrating, debugging, building a proof of concept, or explaining it.

Two readers, in this order:
1. **Recruiter / HR (60 seconds):** plain-English pitch → click **Try it** → pre-loaded example → clear result. No jargon above the fold.
2. **Hiring manager / engineer (5–10 min):** architecture, quickstart, troubleshooting, source code.

**The 60-second test:** a non-technical visitor can open a project page and see it work in under 60 seconds, with no sign-up, install, or API key. A project that fails the test is not listed on the home page.

## Non-negotiable rules

- **Never put an API key, token, or secret in front-end code**, in a committed file, or in a demo recording. Keys live only in server-side environment variables or hosting secrets.
- **Synthetic or public data only.** Never use, reference, or screenshot anything from Boldr, Accenture, Anthropic customers, OpenAI customers, or internal tools (Forge, Hex, Intercom workspaces, Salesforce orgs, DataDog accounts). If Harsh pastes something that looks like real customer or employer data, stop and flag it.
- **Label demos honestly.** Recorded runs are labelled "Recorded run · <date> · <model>". Simulations say they are simulations. Never present a replay as live.
- **No impersonation of real brands.** Fictional company and bank names only, and check that they don't match a real institution. The e-commerce project must not use a real retailer's name or logo.
- **Don't push, deploy, publish, or change repo settings without Harsh confirming.** Commits on a feature branch are fine. Ask before `git push`, enabling GitHub Pages, creating Hugging Face Spaces, or anything that costs money.
- **Back every performance claim.** Any number on the site (throughput, latency, accuracy) needs a reproducible benchmark or eval in the repo. If it can't be reproduced, soften the wording and tell Harsh.

## Repos

| Repo | Project | Tier | Status |
| --- | --- | --- | --- |
| `hpk369/hpk-website` | Portfolio site (GitHub Pages) | — | Redesign |
| `hpk369/ai-qa-agent` | ETL Triage Agent (formerly AI QA Agent) | Featured | Revamp |
| `hpk369/bank-platform` | Banking Transaction Platform | Featured | Revamp |
| _new_ | LLM API Diagnostics Toolkit | Featured | New build |
| _new_ | Bank Policy Assistant (RAG proof of concept) | Featured | New build |
| _new_ | MCP Ticketing Server | Supporting | New build |
| _new_ | LLM Usage & Cost Monitor | Supporting | New build |
| `hpk369/CineMatch` | CineMatch | Supporting | Light revamp |
| `hpk369/supply_chain_blockchain` | Blockchain Supply Chain Tracker | More projects | Revamp |
| `hpk369/pyredis` | PyRedis | More projects | Revamp |
| `hpk369/javascript-amazon-project` | E-commerce front end (rebrand) | More projects | Quick revamp |

Ask Harsh for names before creating new repos.

## Demo standard (applies to every project)

### Modes
- **Replay (default, required):** a real run recorded once and played back in the browser. Static, runs on GitHub Pages, free, and can't break.
- **Live (optional):** a real backend, only where interaction is the point (the RAG assistant, and optionally the triage agent). Must have the guardrails below.
- **Guided tour (featured projects):** a 3–5 step overlay walkthrough plus a 60–90 second video.

### Live-mode guardrails
- Key server-side only, a hard monthly spend cap on the API account, per-visitor rate limiting, and an input length cap.
- Prefer fixed scenarios or buttons over free text. If free text is allowed, cap the length and handle prompt-injection attempts safely.
- **Automatic fallback to replay** when the backend is asleep, slow (timeout of a few seconds), errors, or is rate limited, with a visible note saying so.
- Show a "waking up" state, never a blank screen.

### Replay recording format
All replays use one JSON shape so a single shared player renders them:

```json
{
  "id": "schema-drift",
  "title": "Schema drift in the orders pipeline",
  "source": "recorded",
  "recorded_at": "2026-10-20",
  "model": "claude-haiku-4-5",
  "steps": [
    { "t_ms": 0,    "type": "event",       "label": "Pipeline event received", "payload": {} },
    { "t_ms": 900,  "type": "tool_call",   "label": "schema_comparator",       "payload": {} },
    { "t_ms": 1700, "type": "tool_result", "label": "schema_comparator",       "payload": {} },
    { "t_ms": 3200, "type": "message",     "label": "Assistant narration",     "payload": { "text": "..." } }
  ],
  "outcome": { "summary": "P1 incident opened", "severity": "P1" }
}
```

Allowed `type` values: `event`, `tool_call`, `tool_result`, `message`, `metric`, `log`, `alert`.
Scrub recordings before committing: no keys, no emails, no real hostnames, no personal data.

### Project page template (same structure on every project)
1. One-line problem statement in plain English
2. **Try it**: replay or live, with 2–3 pre-loaded examples
3. "What just happened", in 3 plain sentences
4. Customer artifacts: architecture diagram, quickstart, troubleshooting guide, known limitations
5. Links to the source code and the walkthrough video

### Shared demo kit
Build once in phase 2 and reuse everywhere: page template, replay player (reads the JSON above, with play, pause, speed, and step list), live/replay switch with fallback, and the "Recorded run" label component. Keep it framework-light (plain HTML/CSS/JS or one small library) so it works on GitHub Pages with no build server.

## README structure (every repo)

1. Pitch (one sentence, plain English) + live demo link
2. What it does (3–5 bullets)
3. Architecture diagram
4. Quickstart (copy-paste commands; Docker preferred)
5. Troubleshooting (common errors → cause → fix)
6. Known limitations
7. How the demo works (replay vs live, what data it uses)
8. Tests and how to run them

## Project specs

### 1. ETL Triage Agent (`ai-qa-agent`), featured
- **Pitch:** When a data pipeline breaks, this agent works out what broke and how serious it is, then alerts the right person with a suggested fix.
- Existing demo: client-side simulation of real severity logic, 5 failure modes (clean, row drop, schema drift, null spike, Kafka lag), Slack preview with Approve/Reject/Escalate. Keep it.
- **Do:** unify the name and stack description across README, demo, and site. Put the pitch above the fold. Record one real Claude tool-use run per failure mode and replay it. Add a "What the on-call engineer receives" panel (incident record, runbook link, escalation note written as a reproducible case). Replace the ASCII architecture with a diagram. Reduce emoji.
- Optional live mode: fixed scenarios only, no free text.
- **60s path:** Schema drift → Run → Claude calls tools → P1 + Slack alert → Escalate.

### 2. Banking Transaction Platform (`bank-platform`), featured
- **Pitch:** A bank's payment system that flags suspicious transactions as they happen, and keeps running when something breaks.
- Known issue: the demo page showed "Connecting…" with empty metrics, so it likely needs a backend. **Verify first.** If confirmed, this is the top fix.
- **Do:** replay stream from recorded pipeline output (JSON) with a speed control. "Explain this alert" for each fraud alert (which rule fired, one plain sentence). **Incident drill:** "Break something" (consumer lag, crashed Spark job, malformed record) → symptoms → health check → runbook → Resolve. Benchmark section for the throughput and latency claims, or soften them. Merge `Kafka-and-Spark-upgrade` into `main`.
- **60s path:** watch the stream → click an alert → Break something → follow the runbook → Resolve.

### 3. LLM API Diagnostics Toolkit (new), featured
- **Pitch:** When a company's AI feature stops working, this tool explains why in plain English and how to fix it.
- CLI (`llmdoctor check`) plus a static web page sharing one rules library.
- Covers 401, 403, 429 (+ `retry-after`), 5xx/overloaded, context length exceeded, 400 malformed, unknown model, streaming disconnects, client timeouts, for Claude and OpenAI. **Build only from public docs.**
- Demo: error explainer (paste an error or pick from 10 samples), rate-limit simulator (naive retries vs exponential backoff with jitter), recorded terminal session. **Never ask visitors for an API key.**
- Tests use recorded API responses as fixtures. Language is an open decision (Python or Go); ask.

### 4. Bank Policy Assistant, RAG proof of concept (new), featured flagship
- **Pitch:** An AI assistant that answers staff questions about a bank's policies, shows which document each answer came from, and says "I don't know" instead of guessing.
- Fictional bank. 20–40 synthetic policy docs (fees, card disputes, mortgage prepayment, account closure, wire limits).
- Cited answers, refusal on out-of-scope questions, an eval set of about 50 questions scored for retrieval accuracy and faithfulness, with results shown on the page.
- Demo: live with guardrails + replay fallback + "Try to break it" (out-of-scope, ambiguous, prompt injection).
- Customer handoff package in `/docs`: discovery notes, solution design, architecture, quickstart, eval report, security and privacy notes, known limitations, go-live checklist.
- Stack: Python, pgvector, Claude API, FastAPI or Gradio.

### 5. MCP Ticketing Server (new), supporting
- **Pitch:** Lets an AI assistant safely look up and update support tickets in plain English.
- MCP server over PostgreSQL with synthetic tickets. Tools: `search_tickets`, `get_ticket`, `list_sla_breaches`, `add_internal_note`, `change_status` (write tools require confirmation). Resources: SLA policy, escalation matrix. Read-only and read-write modes.
- Demo: replay transcript (chat on the left, tool calls on the right), tool inspector page, 90-second video.
- Use the official MCP SDK. Language is an open decision.

### 6. LLM Usage & Cost Monitor (new), supporting
- **Pitch:** Shows a company where its AI spending is going and warns about a surprise bill before the invoice arrives.
- Synthetic usage logs (timestamp, team, key, model, input/output tokens) + a price table clearly labelled "example prices".
- Spend breakdown, anomaly alerts vs each key's own baseline, invoice reconciliation with two seeded mismatches, month-end forecast.
- Demo: static dashboard + "Inject a runaway script" button. Stack: Python + DuckDB → pre-computed JSON → JS charts.

### 7. CineMatch, light revamp
- Demo already passes the 60-second test. Add a "Why this movie?" line per recommendation, a side-by-side view of the three algorithms, hybrid results for all users (or make the limit obvious), a faster data load, and a "How I'd build it today" note. Fix the "mrjbob" typo on the site.

### 8. Blockchain Supply Chain Tracker, revamp
- Reframe as a **tamper-evident audit log**. In-browser simulation (port the ledger logic to JS or run it via Pyodide), a role switcher (manufacturer, distributor, retailer, auditor), and a **Tamper** button that breaks the chain at the edited block.

### 9. PyRedis, revamp
- Run the core store in the browser with Pyodide (exclude Flask and socket code; check dependencies first). Terminal-style input for SET/GET/DEL/EXPIRE, a "Restart server" button that reloads from the snapshot, and a cheat sheet.

### 10. E-commerce front end (formerly Amazon clone), quick revamp
- Rebrand with a fictional store name and logo, remove all real-retailer branding, enable GitHub Pages, and credit the course in the README if it was built from one.

## Portfolio site (`hpk-website`)
- Positioning: **Customer Engineer** focus. Current headline "Application Support Analyst" must change.
- Home page: featured projects first (pitch + Try it button), then supporting, then a "More projects" link. Include OpenAI and Anthropic platform support experience, which the current site omits.
- Field notes section: three short write-ups (rate limits in production LLM apps; what a good escalation looks like; shipping a RAG proof of concept a customer can trust).
- Visual direction: **not decided yet. Ask Harsh before styling.** Must work on phone width and support dark mode.
- Remove skills Harsh can't back up in an interview. Linux is listed but is not a strong area, so ask before keeping it prominent.

## Build order

1. **Quick fixes:** bank demo loads without a backend, one name for the triage agent, rebrand and publish the e-commerce project, polish CineMatch.
2. **Demo kit + featured revamps:** shared template and replay player, triage agent recordings, banking replay + incident drill.
   → **Gate: launch the redesigned site.** List only projects that pass the 60-second test.
3. **First new builds:** Diagnostics Toolkit (+ rate-limit field note), Usage & Cost Monitor, Blockchain and PyRedis in-browser demos.
4. **Flagship:** Bank Policy Assistant (RAG) with handoff package, MCP Ticketing Server, remaining field notes.

Don't start a later phase's work unless Harsh asks.

## Definition of done (per project)

- [ ] Passes the 60-second test in a private browser window, on desktop and phone
- [ ] Replay works with the network blocked to any backend
- [ ] Live mode (if any) has spend cap, rate limit, input cap, and auto-fallback
- [ ] No secrets in the repo (`git grep` for key prefixes before every commit)
- [ ] README follows the structure above, with all customer artifacts present
- [ ] Every number on the page is backed by a benchmark or eval in the repo
- [ ] Demo data is synthetic or public; recordings scrubbed
- [ ] Portfolio card updated with the same name, pitch, and stack as the README

## Open decisions (ask, don't assume)

- Python or Go for the Diagnostics Toolkit and MCP server
- Monthly spend cap and hosting (Hugging Face PRO vs free tier) for live modes
- Fictional bank name for the RAG proof of concept
- One demo domain (`demo.inkandinfra.com` is already used by the triage agent) vs `github.io`
- "More projects" as a separate page or a home-page section
- Visual direction for the site

## Working with Harsh

- Strong in Python, SQL, Kafka/Spark, and APIs. **Linux is not a strong area:** when giving shell commands, add a one-line explanation of what each does and flag anything destructive.
- Prefers finished, working output over long explanations. Summarize what changed and what's next in a few lines.
- When a task touches an open decision, stop and ask with 2–3 concrete options and a recommendation.
