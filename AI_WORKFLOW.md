# AI-assisted engineering workflow

## AI tools used

OpenAI ChatGPT (GPT-6) assisted with scope decomposition, implementation drafts, UI design, backend/data modeling, test planning, and documentation. Local Node.js execution was used for tests and manual API verification.

## Where AI accelerated the work

- Converted an ambiguous product brief into a minimal but complete vertical slice.
- Drafted frontend HTML/CSS/JavaScript and Node.js backend quickly, without a dependency installation step.
- Proposed access checks and optimistic concurrency tests across owner/editor/viewer paths.
- Generated readable setup, architecture, and limitation documentation.

## Human judgment, changes and rejected approaches

- Prioritized a small end-to-end product over a speculative real-time collaboration implementation.
- Chose built-in Node SQLite and a zero-build UI over dependency-heavy frameworks given time constraints.
- Explicitly separated demo account switching from production authentication.
- Rejected silently overwriting concurrent edits; used a document revision check and HTTP 409.
- Restricted import types to `.txt` and `.md`, rather than claiming unreliable `.docx` parsing.

## Verification

- Ran built-in automated integration tests, including an authorization test for viewer updates and conflict handling.
- Exercised the API against a temporary SQLite store.
- Inspected generated source and documentation for setup consistency.
- The initial Windows browser launch surfaced a static-path bug; the server's static-file handling was corrected and a homepage regression test added, increasing automated coverage to eight tests.
- The user manually confirmed the corrected application opened locally, verified sharing and file import, and confirmed that the hosted Render URL opens in a browser.
- The Render Free deployment uses ephemeral SQLite storage. Data can be lost after spin-down, restart, redeployment, or instance replacement; production use requires durable storage.

AI accelerated construction; correctness and tradeoff accountability remain the candidate's responsibility. This note should be amended to reflect any additional manual changes or tests performed after handoff.
## Stretch feature: version history

AI-assisted implementation added immutable revision snapshots in SQLite, server-side history and restore endpoints, a preview/restore interface, and regression tests. The feature was tested using Node's built-in test runner (11 tests passing), including version recovery and permission checks. It deliberately reuses the existing authorization and optimistic-revision model rather than adding a real-time collaboration framework.
