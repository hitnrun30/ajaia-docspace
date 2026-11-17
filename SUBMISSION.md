# Submission inventory

## Included in this project

- `src/server.js` — HTTP server, REST API, session cookie logic, static serving.
- `src/store.js` — SQLite schema, seed accounts, document/sharing persistence.
- `src/sanitize.js` — constrained rich-text sanitization, TXT/Markdown importer.
- `public/index.html`, `styles.css`, `app.js` — complete responsive browser UI.
- `tests/app.test.js` — automated API integration tests.
- `README.md` — local setup, deployment notes, demo instructions, limitations.
- `ARCHITECTURE.md` — design and prioritization notes.
- `AI_WORKFLOW.md` — AI usage, judgment, verification.
- `WALKTHROUGH_SCRIPT.md` — 3–5 minute recording outline.
- Walkthrough video URL — **requires a recorded video URL before submitting**.
- Live application — https://ajaia-docspace-ut5k.onrender.com

## Live deployment

**Live demo:** https://ajaia-docspace-ut5k.onrender.com  
**Source:** https://github.com/hitnrun30/ajaia-docspace  
**Review status:** The user confirmed the deployed app opens correctly in a browser, and verified local sharing and .txt/.md importing. Browser verification of the hosted create/save workflow should be completed before final submission.

**Free-tier storage limitation:** Render Free runs the SQLite file on ephemeral disk. Documents may be lost on redeploy, restart, spin-down or instance replacement; reviewers should not store important data. This is a demo, not durable production hosting.

## Demo users

Alex Morgan (alex@example.test), Jordan Lee (jordan@example.test), Sam Rivera (sam@example.test). Select users in the sidebar; no password needed for the assessment demo.

## Incomplete / deliberately scoped out

Real production authentication; true simultaneous editing; full DOCX import; durable production storage; real authentication; video recording.

## If additional development time were available

TipTap editor, proper auth and invite links, durable managed DB, improved concurrent-edit merge UX.