# Ajaia — AI-Native Full Stack Developer Assessment

**Candidate:** Steven Strauss  
**Project:** Docspace — lightweight collaborative document editor  
**Live product:** https://ajaia-docspace-ut5k.onrender.com  
**Source repository:** https://github.com/hitnrun30/ajaia-docspace  
**Walkthrough video:** Recorded; Google Drive video URL will be provided in Ajaia's separate **Video Submission Link** field

## Working implementation

Docspace is a focused full-stack document editor built with a responsive HTML/CSS/JavaScript frontend, a Node.js HTTP API, and SQLite persistence. It supports creating and renaming documents, rich-text editing (bold, italic, underline, headings, lists), autosave and reopening, importing `.txt` and `.md` files, and owner/editor/viewer sharing between three seeded demo accounts. The interface distinguishes **My documents** from **Shared with me**. Server-side authorization checks and optimistic revision conflict detection protect updates.

## Try the primary flow

1. Open the deployed site and select **Alex Morgan**.
2. Create a document, edit and format its content, and wait for the saved indicator.
3. Share the document with **Jordan Lee** as an editor.
4. Switch to Jordan and open **Shared with me**; edit the document.
5. Switch back to Alex to verify the saved changes. Optionally repeat with viewer-only access.
6. Import a `.txt` or `.md` document and verify it can be edited.

## Implementation and verification

- Source: https://github.com/hitnrun30/ajaia-docspace (frontend, server, tests, and setup files).
- Setup: Node.js **22.13+**, run `npm start` and open `http://localhost:3000`; run `npm test` for automated coverage.
- Automated integration tests cover persistence, permissions, import, sanitization, and revision conflict behavior. **Eight automated tests passed in the preparation environment, including the Windows homepage regression test.**
- Detailed documentation: `README.md`, `ARCHITECTURE.md`, `AI_WORKFLOW.md`, `SUBMISSION.md`, and `WALKTHROUGH_SCRIPT.md`.

## Engineering tradeoffs

I prioritized one coherent create → edit → persist → share workflow over real-time multi-cursor collaboration. Seeded users make sharing easy to evaluate without requiring sign-up, but are **not production authentication**. File import is intentionally limited to UTF-8 `.txt` and `.md` rather than unreliable DOCX conversion. SQLite is appropriate for this scoped demo, but this Render Free deployment uses ephemeral storage. **Documents can be lost when the service restarts, spins down, redeploys, or its instance is replaced. Reviewers should not store important data.** Durable production hosting would use persistent storage or a managed database. Rich-text editing uses the browser's built-in `contenteditable` APIs rather than a heavier editing framework.

## AI-native workflow

ChatGPT assisted in decomposing requirements, drafting implementation and UI, writing tests, and preparing documentation. The engineering decisions included rejecting over-scoped real-time editing, preserving permission checks on the server, using revision conflicts instead of silently overwriting edits, and being explicit about demo-only authentication and storage limitations. Eight automated tests passed. Manual testing confirmed the local application and the live Render deployment, including document editing, file importing, and sharing. Full details are in `AI_WORKFLOW.md`.

## Walkthrough video

The narrated walkthrough has been recorded. Its shareable Google Drive video URL is supplied separately in Ajaia's **Video Submission Link** field. No project deliverables require access to a Google Drive folder; current code, documentation, and tests are maintained in the public GitHub repository.

## If another 2–4 hours were available

Add production authentication and secure sharing invitations, replace ephemeral SQLite deployment storage with a durable database or mounted volume, improve concurrent-edit conflict UX, and consider a maintained rich-text editor library.