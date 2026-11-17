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
- `walkthrough-url.txt` — **requires a recorded video URL before submitting**.
- `live-url.txt` — **requires a deployed, working HTTPS URL before submitting**.

## Live deployment

NOT YET DEPLOYED. Replace the placeholder in `live-url.txt` after verifying the public site.

## Demo users

Alex Morgan (alex@example.test), Jordan Lee (jordan@example.test), Sam Rivera (sam@example.test). Select users in the sidebar; no password needed for the assessment demo.

## Incomplete / deliberately scoped out

Real production authentication; true simultaneous editing; full DOCX import; persistent deployment on an ephemeral-free hosting plan; browser-verified deployment; video recording.

## Next 2–4 hours

TipTap editor, proper auth and invite links, durable managed DB, improved concurrent-edit merge UX.