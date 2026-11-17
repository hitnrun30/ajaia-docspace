# Walkthrough recording guide (target: 3–5 minutes)

**00:00–00:30 — Context:** “This is Docspace, a lightweight collaborative document editor. I prioritized a complete create/edit/share/reopen flow rather than Google Docs feature parity.”

**00:30–01:30 — Main editor:** As Alex, create a document, rename it, type a paragraph and heading, apply bold/italic/underline and list formatting, then point to autosave. Return to the library, reopen it and show formatting persisted.

**01:30–02:15 — File import:** Import a `.md` or `.txt` file, demonstrate that it opens as an editable document, and state the supported file types.

**02:15–03:15 — Sharing:** Share Alex's document with Jordan as editor. Switch to Jordan, show the Shared with me filter, edit the document. Switch back to Alex, reopen and show the change. Optionally demonstrate viewer/read-only access.

**03:15–04:00 — Engineering choices:** Describe SQLite persistence, signed demo-user cookie, enforced owner/editor/viewer permissions, sanitization and optimistic locking; explain why real auth and simultaneous editing were out of scope.

**04:00–04:30 — AI workflow:** Explain ChatGPT-assisted scaffolding, architecture/tests, human scope decisions and verification. Mention automated tests and any manual browser checks actually performed.

Do not claim deployed availability or browser tests that have not been verified. Record with Loom, OBS, or an equivalent screen recorder, then replace `walkthrough-url.txt` with the unlisted URL.