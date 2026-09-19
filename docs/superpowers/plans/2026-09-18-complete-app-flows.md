# Complete App Flows Implementation Plan

**Goal:** Close functional gaps outside the 24 domain acceptance checks without violating the fixed Óris360° App structure.

**Status:** implementation and review complete on the feature branch; final documentation SHA still requires fresh CI before branch finishing.

## Approved design

- [x] Keep DEMO explicit.
- [x] Keep the fixed ten-item seller menu unchanged.
- [x] Add device-level integration setup outside that menu.
- [x] Store only non-secret API metadata.
- [x] Require real API health validation before activation.
- [x] Keep server secrets out of the browser.
- [x] Preserve `OrisGateway` as the integration boundary.

## Functional work

- [x] Password recovery gateway flow.
- [x] Reports & Commissions gateway flow.
- [x] Sistema Online integrated-session/SSO flow.
- [x] WhatsApp/AI status and management flow.
- [x] Actionable Help contacts.
- [x] Mission Web Push client/subscription flow.
- [x] Integration setup and diagnostics.
- [x] Dynamic backend-defined customer fields.
- [x] Mission evidence validation.
- [x] Real API runtime payload validation.
- [x] Offline-auth realm isolation.
- [x] Local database realm isolation.
- [x] Client-owned `scopeKey` mapping.

## TDD evidence observed during implementation

- [x] Integration-config and HTTP-gateway tests failed before modules existed.
- [x] Web Push helper tests failed before implementation.
- [x] Dynamic-customer-field persistence test failed before persistence/schema support.
- [x] Mission-evidence tests failed before validator implementation.
- [x] Malformed-HTTP-success test failed before runtime response validation.
- [x] Integration-specific offline-auth test failed before realm namespacing.
- [x] Integration-realm local-data test failed before scope-key isolation.
- [x] Case-sensitive realm test failed before URL normalization correction.

## Review/security corrections

- [x] Never store server/API private keys in browser storage.
- [x] Real integration only activates after health check.
- [x] External JSON is validated before domain use.
- [x] Integration environments cannot share offline auth.
- [x] Integration environments cannot share local DB scope.
- [x] Local-only identifiers do not become server contract requirements.
- [x] Push subscription is removed on logout/company change.
- [x] External URLs used by Online/WhatsApp flows are constrained to HTTPS (localhost allowed for development).

## Verified code SHA

`6bde97aee6bf124871cf81c9586f547f55801225`

Evidence on that SHA:
- [x] Engine integrity — success.
- [x] Runtime dependency audit — 0 vulnerabilities.
- [x] ESLint — success.
- [x] Vitest — 12 files / 65 tests passed.
- [x] TypeScript/Vite production build — success.
- [x] PWA/Netlify artifact check — success.
- [x] Playwright Chromium — 7/7 journeys passed.

## External boundaries still pending

- [ ] Official Óris360° API URL/routes — external input required.
- [ ] Real server implementation — external system required.
- [ ] Real SSO provider — external system required.
- [ ] WhatsApp/AI provider — external system required.
- [ ] VAPID private key/push sender — server-side required.
- [ ] Official complete customer schema — backend input required.
- [ ] Existing Delivery module literal reuse — source/contract required.
- [ ] Production Netlify deployment/post-deploy verification — authorized deployment access required.

## Branch finishing

- [ ] Obtain fresh CI for final documentation/state SHA.
- [ ] Review final diff.
- [ ] Choose branch finishing action (merge / PR / keep branch).
