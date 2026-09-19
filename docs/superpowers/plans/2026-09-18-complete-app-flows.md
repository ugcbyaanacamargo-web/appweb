# Complete App Flows Implementation Plan

**Goal:** Close functional gaps that remain outside the 24 domain acceptance checks without violating the fixed Óris360° App structure.

## Approved design

The user authorized autonomous completion of missing flows. The fixed ten-item seller menu remains unchanged.

### Integration architecture
- Keep DEMO mode explicit and functional.
- Add a device-level **Configuração técnica da integração** outside the fixed seller menu, reachable before login and from Sistema Online.
- Store only non-secret integration metadata locally: base URL and endpoint paths.
- Never store server secrets/API private keys in browser storage.
- A real HTTP gateway activates only after its configured health endpoint succeeds.
- The HTTP backend must satisfy the documented Óris360° gateway contract; no official endpoint is invented.

### Functional gaps to close
1. Password recovery becomes a real gateway action.
2. Reports/Commissions loads real gateway data (DEMO or HTTP).
3. Sistema Online requests an integrated session/SSO URL from the gateway.
4. WhatsApp page loads backend integration status/management URL.
5. Help contacts become actionable links.
6. Mission notification setup registers Web Push when the backend supplies a public VAPID key.
7. Integration setup validates connection and explains where each value comes from.
8. Errors identify missing/invalid integration configuration.
9. Browser tests cover integration setup and newly functional flows.

### External boundaries that remain external
- Official Óris360° endpoint URLs/credentials.
- Server-side API implementation if the existing backend does not match the gateway contract.
- Server-side Web Push delivery/VAPID private key.
- Real Sistema Online SSO provider.
- Real WhatsApp/AI provider configuration.
- Full customer schema fields not supplied by the real API contract.
- Existing Delivery catalog code if it lives outside this repository.

## TDD / delivery
- Add failing tests for integration config and HTTP adapter.
- Implement infrastructure.
- Implement UI flows.
- Extend Playwright.
- Run lint, Vitest, build, Playwright, engine validator and GitHub Actions.
- Review/security review before merge.
