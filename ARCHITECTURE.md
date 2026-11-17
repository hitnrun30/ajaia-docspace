# Architecture and product decisions

## Product slice

The highest-value outcome in four hours is a coherent **create → format → autosave → share → switch user → reopen** workflow, not a miniature enterprise suite. The app has one server, one SQLite database, and a responsive zero-build frontend. This makes it easy for reviewers to run without configuring infrastructure or purchasing services.

## Data model

- `users`: three seeded demo identities.
- `documents`: `id`, `title`, sanitized rich-text HTML, `owner_id`, timestamps and `revision`.
- `document_shares`: unique (`document_id`, `user_id`) with `editor` or `viewer` permission.

Owner can update and share. Editor can update. Viewer can read. Routes enforce permissions in SQLite queries; the UI additionally disables unauthorized actions. A signed cookie selects the simulated demo identity, but there is no password login.

## Editor and persistence

Native `contenteditable` keeps the editor fast to implement. Formatting commands cover a deliberately small set of features. Server-side HTML sanitization preserves a strict tag allowlist and removes all attributes to reduce injection risk, while keeping headings, emphasis and lists. The editor autosaves on an idle debounce. A revision number provides basic optimistic concurrency: stale writes return HTTP 409 instead of silently overwriting newer content.

## File handling

An uploaded `.txt`/`.md` file is converted into a new document rather than attached as arbitrary binary content. This makes the upload immediately useful and avoids storage complexity. The server enforces extension, file-size, UTF-8, and title constraints. Markdown conversion supports a documented subset, not full Markdown.

## Testing

Tests exercise creating, updating, sharing, viewer restrictions, stale revisions, import, and sanitization at the API level. Manual smoke testing should verify toolbar operations and the responsive layout using a Chromium-based browser.

## Deliberate cuts

- No real-time multiplayer editing, cursors, CRDT/OT, comments, version history, or PDF/DOCX conversion.
- No production identity provider, email invites, public links, or enterprise authorization.
- No offline sync or robust merge-on-conflict UX; an HTTP 409 gives a clear warning.
- Native editing commands are deprecated browser APIs. For a production product, replace them with a maintained editor framework such as TipTap/ProseMirror and a thoroughly reviewed HTML sanitizer library.
- SQLite with one instance is fine for assessment/local use; migrate to Postgres plus real authentication for multi-instance deployment.

## If given another 2–4 hours

1. Migrate editor to TipTap with structured JSON and a robust sanitizer.
2. Add production authentication and document invitations by verified email.
3. Improve conflict resolution and keyboard/accessibility testing.
4. Add durable managed database storage and deployment observability.
## Stretch feature: version history

`document_versions` stores snapshots of the title and sanitized HTML for each saved revision, recording the editor and timestamp. The API restricts history reads to document collaborators and restores to owners/editors. Restore checks the current revision to avoid overwriting concurrent work and creates a new revision rather than deleting later history. Existing databases gain a baseline snapshot on startup.
