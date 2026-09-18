# Repository Brain + CI/E2E Implementation Plan

> **For agentic workers:** execute inline with review checkpoints and fresh verification evidence.

**Goal:** Make the repository self-navigating for ChatGPT Web and add automated gates that detect incomplete UI behavior.

**Architecture:** Keep upstream gstack, Superpowers and ECC pinned under `vendor/`. Add a small linked knowledge graph under `docs/brain/`, preserve the user's functional master prompt in-repo, and strengthen GitHub Actions with lint and Playwright E2E.

**Tech Stack:** Markdown/JSON, Python 3, React/TypeScript/Vite, ESLint, Playwright, GitHub Actions.

**Spec:** `docs/specs/ORIS360_SALES_APP_MASTER_SPEC.txt`

## Global Constraints

- The master functional rules are immutable.
- Do not claim vendored skills executed when the host did not execute them.
- Do not make feature work directly on `main`.
- No invented API details.
- Completion requires fresh CI evidence.

---

### Task 1: Add the repository brain

**Files:** `AGENTS.md`, `docs/brain/**`, `docs/specs/**`, `scripts/validate_engine.py`

- [x] Add a single brain entry point.
- [x] Add machine-readable graph and linked routes/nodes.
- [x] Preserve the master prompt verbatim.
- [x] Validate graph paths, master rules and acceptance-test markers.

### Task 2: Add static and browser verification

**Files:** `package.json`, `eslint.config.js`, `playwright.config.ts`, `e2e/sales-flow.spec.ts`, `.github/workflows/**`

- [x] Add lint gate.
- [x] Add Playwright Chromium E2E.
- [x] Test fixed menu, quote customer/product gating, persistence after reload, explicit send lock and duplication.
- [x] Run E2E in GitHub Actions.

### Task 3: Persist durable project truth

**Files:** `README.md`, `PROJECT_STATE.md`, `DECISIONS.md`

- [x] Document the brain entry point and new verification commands.
- [x] Correct production-readiness wording so DEMO vs real API remains explicit.
- [x] Record graph/CI decisions.

### Task 4: Delivery verification

- [x] Open PR #6 from `feature/repository-brain-ci-e2e`.
- [x] Inspect all workflow jobs for the verified PR head `48ccad3c7a14f19359c7726f4ecc7c5c3c96b8b8`.
- [x] Fix lint and Vitest/Playwright discovery failures and re-run.
- [x] Review final diff against this plan and the master specification.
- [x] Confirm `Engine integrity`, `app-ci` and `e2e` succeeded on the same head SHA.
- [x] Merge PR #6 using expected head SHA protection.

## Verification evidence

- `Engine integrity` run #58: success.
- `app-ci` run #94: success.
- `e2e` run #7: success.
- Playwright exercises 3 browser journeys: fixed menu, quote/customer/product gating + reload persistence, and explicit send lock + duplication.
- Merge commit: `83f4fb916149a09d8c35d30baa586a5234cd661c`.
