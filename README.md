# Docspace — lightweight collaborative document editor

A deliberately focused Google Docs–inspired application. Built for the Ajaia AI-Native Full Stack Developer assessment.

## Features

- Create, rename, autosave, reopen, and search documents.
- Browser rich-text editing: bold, italic, underline, headings, numbered and bulleted lists.
- Import UTF-8 `.txt` or `.md` files (up to 512 KB) as editable documents.
- Owner/editor/viewer document permissions. Three selectable seeded demo accounts.
- A distinct **My documents** and **Shared with me** library view.
- SQLite persistence with server-side permission enforcement and optimistic revision conflict handling.
- Responsive interface, save feedback, validation, error handling, and API tests.

## Requirements and local setup

**Node.js 22.13+** (uses the built-in `node:sqlite` module). No npm packages or paid services required.

```bash
npm start
```

Open **http://localhost:3000**. Data is created at `./data/docspace.sqlite` and persists across restarts. To reset the demo, stop the server and remove the `data` directory. Run automated tests using:

```bash
npm test
```

For production-like hosting, configure:

- `PORT` — HTTP port; defaults to `3000`.
- `DB_PATH` — writable SQLite database path; defaults to `./data/docspace.sqlite`.
- `SESSION_SECRET` — stable random secret for signed demo-session cookies.

## How to review the sharing flow

1. Select **Alex Morgan** in the lower-left account selector.
2. Create a document, type content and apply formatting. Saving happens after ~750 ms of inactivity.
3. Click **Share** and grant **Jordan Lee** editor or viewer access.
4. Switch the account selector to **Jordan Lee**. Open **Shared with me** and select the document.
5. With editor access, make a change. Switch to Alex to confirm it persisted. With viewer access, editing controls are disabled; direct API updates are also forbidden.

The account selector is intentionally **simulated authentication**, not security-grade identity verification. It is suitable for demonstrating access logic, not a real production deployment.

## File import

Use **Import document**. The app accepts `.txt` and `.md` UTF-8 text only. Markdown support is deliberately limited to headings, paragraphs, numbered/bulleted lists, bold, and italic; it is not a full CommonMark parser. `.docx` is not supported in this timebox. Imported files become editable database records.

## Live demo

**Application:** https://ajaia-docspace-ut5k.onrender.com  
**Source:** https://github.com/hitnrun30/ajaia-docspace

**Free-tier data retention disclosure:** This assessment demo uses Render Free with a local SQLite file on ephemeral storage. Document edits persist during normal operation and page refreshes, but the database **can be erased when Render redeploys, restarts, spins down or replaces the service instance**. Reviewers should treat their data as temporary. Production deployment would require durable persistent storage or a managed database.

## Deployment

The app is a single Node.js HTTP service with no frontend build step. Deploy the repository as a Node service on a host supporting Node 22.13+ (e.g. Render). Use `npm start` as the start command. Set `SESSION_SECRET` to a long random value and `DB_PATH` to a writable location.

**Important persistence limitation:** Some free hosting plans use ephemeral disks. SQLite data will persist across refreshes and while the instance remains running, but can reset on instance replacement or redeployment. A durable mounted volume, or moving the database to a managed Postgres service, is required for production-grade persistence. Do not claim data durability on an ephemeral host.

## Stack

- Frontend: HTML, CSS, vanilla JavaScript; browser `contenteditable` and formatting commands.
- Backend: Node.js built-in HTTP server.
- Database: SQLite via Node's built-in `node:sqlite` module.
- Authentication: signed demo-user cookie, selectable seeded accounts.
- Tests: built-in `node:test` integration tests.

Read [ARCHITECTURE.md](ARCHITECTURE.md) for tradeoffs and [AI_WORKFLOW.md](AI_WORKFLOW.md) for AI usage.

### Render Blueprint deployment (optional)

`render.yaml` is included to simplify a deployment connected to a Git repository. Choose **New → Blueprint**, select the repository and apply the config. Be aware that free hosting may sleep and may replace the instance's ephemeral SQLite files; if reviewers require persistent production data across redeploys, use durable storage instead.