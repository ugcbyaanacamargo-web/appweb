# Skill Router

This file maps user intent to existing upstream/runtime capabilities. It is a routing index, not a new skill framework.

## Routing rule

For each task, choose the smallest set that covers the job. Process skills come before implementation skills. Do not load unrelated skills "just in case."

## Capability map

| Intent | Primary workflow | Supporting pinned upstream skills | Required outcome |
|---|---|---|---|
| New feature / new subsystem | Superpowers `brainstorming` → `writing-plans` → execution | Addy `spec-driven-development`, `planning-and-task-breakdown` | Approved design/spec before implementation |
| Web visual direction / design system | gstack `design-consultation` / `design-shotgun` | Addy `frontend-ui-engineering` | Concrete visual system, hierarchy, typography, spacing, states |
| Build or change UI | Addy `frontend-ui-engineering` | Vercel `web-design-guidelines`; gstack `design-review` | Responsive, accessible, production-quality UI |
| React / Next.js implementation | Addy `frontend-ui-engineering` | Vercel `vercel-react-best-practices` | Correct component boundaries and performance patterns |
| Architecture / module boundaries / APIs | gstack `plan-eng-review` | Addy `api-and-interface-design`; Superpowers planning; ECC `api-design` | Explicit contracts, data flow, failure modes, test strategy |
| Research / external integration | ECC `deep-research` / `documentation-lookup` | gstack `investigate`; web/GitHub evidence | Current provider/API facts separated from assumptions |
| Backend / central platform | ECC `backend-patterns` / `api-design` | gstack `plan-eng-review`; Addy API/interface design | Multi-tenant RBAC, persistence, contracts, failure modes |
| Frontend patterns | Addy `frontend-ui-engineering` | ECC `frontend-patterns`; Vercel guidelines | Reusable accessible components consistent with the design system |
| Code structure / implementation | Superpowers TDD/execution | Addy `incremental-implementation`, `source-driven-development` | Small focused modules following existing patterns |
| Semantic context / session setup | Addy `context-engineering` | gstack `context-restore`; repository `PROJECT_STATE.md` + `DECISIONS.md` | Narrow, relevant context restored before edits |
| Persist continuity | gstack `context-save` | repository `PROJECT_STATE.md` + `DECISIONS.md`; ECC `unified-memory` when an actual memory runtime is integrated | Durable factual checkpoint after meaningful work |
| Bug / unexpected behavior | Superpowers `systematic-debugging` | gstack `investigate`; Addy `debugging-and-error-recovery` | Root cause evidence before fix |
| Code review / quality | gstack `review` | Addy `code-review-and-quality`; Superpowers `requesting-code-review` | Correctness, readability, architecture, security, performance |
| Security | gstack `cso` | Addy `security-and-hardening`; ECC `security-review` | Evidence-backed security findings and fixes |
| Performance | gstack `benchmark` when measurable | Addy `performance-optimization`; Vercel React practices | Measure first; optimize proven bottlenecks |
| Browser / end-to-end QA | gstack `qa` / `qa-only` | Addy `browser-testing-with-devtools`; ECC `e2e-testing` | Real behavior verified with available browser/runtime tools |
| Release / deploy | gstack `ship` → `land-and-deploy` → `canary` | Addy `git-workflow-and-versioning`, `ci-cd-and-automation`, `shipping-and-launch` | Reviewed release with post-deploy verification |
| Documentation / architectural record | gstack `document-generate` | Addy `documentation-and-adrs` | Docs match verified behavior and decisions |

## Design stack for future appweb screens

When the user supplies the website prompt, the default design pipeline is:

1. **Understand product intent** — Superpowers brainstorming.
2. **Establish visual direction** — gstack design-consultation/design-shotgun when useful.
3. **Define implementation architecture** — gstack plan-eng-review + Addy api/interface design.
4. **Build UI** — Addy frontend-ui-engineering.
5. **Review interface** — Vercel web-design-guidelines + gstack design-review.
6. **Optimize React/Next.js only if that stack is selected** — Vercel react best practices.
7. **QA and verify** — gstack QA/review plus available build/test/browser evidence.

## Semantic discovery protocol

"Semantic" here means understanding the requested behavior and relationships, not merely matching words.

Before editing:

1. Extract the user's intended **entities** (for example: customer, project, invoice).
2. Extract **actions** (create, search, approve, upload).
3. Extract **states** (loading, empty, error, success, disabled).
4. Extract **relationships/data flow** (which component calls which boundary and what returns).
5. Search the repository for those concepts and related types/functions.
6. Read the closest owning source and tests.
7. Search for a similar completed pattern and reuse its conventions.
8. Only then choose the implementation location.

When GitHub code search is available, use it for this discovery. When a compatible local runtime exists, equivalent grep/index/search tools are acceptable.

## Context limits

Do not dump every vendor repository into context. Start with this router, then read only the relevant `SKILL.md` files and project source needed for the task.

## Runtime limitation

A skill stored under `vendor/` is a pinned source of instructions. It becomes executable only when the current agent/runtime supports that skill mechanism or when its instructions can be faithfully applied through tools actually available.
