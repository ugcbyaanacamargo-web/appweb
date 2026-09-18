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

- [ ] Open PR from `feature/repository-brain-ci-e2e`.
- [ ] Inspect all workflow jobs for the PR head SHA.
- [ ] Fix any failure and re-run.
- [ ] Review diff against this plan and the master specification.
- [ ] Merge only after mandatory checks succeed.
