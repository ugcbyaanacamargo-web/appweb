# Functional Audit — Óris360° Sales App

Date: 2026-09-18
Baseline: main @ 37f51126db61c045f26df9960db995a92fe3c96e

## 24 master acceptance criteria

All 24 criteria have automated domain/service evidence in `docs/ACCEPTANCE_MATRIX.md`. Browser coverage currently proves three core seller journeys. This audit extends coverage to flows that the master prompt describes but the 24-item matrix does not fully prove.

## Confirmed gaps before this implementation

| Area | Baseline status | Required action |
|---|---|---|
| Esqueci a senha | INCOMPLETE — informational toast only | Gateway method + real form/result |
| API real setup | MISSING | Safe integration configuration UI + validation |
| HTTP gateway | MISSING | Configurable adapter implementing OrisGateway |
| Reports & Commissions | INCOMPLETE — placeholder | Fetch/render seller-only report |
| Sistema Online | INCOMPLETE — static URL only | Request integrated online session/SSO URL |
| IA no WhatsApp | INCOMPLETE — placeholder | Fetch integration status + management action |
| Ajuda | PARTIAL | Clickable phone/WhatsApp/email actions |
| Mission background push | PARTIAL — foreground polling/Notification only | Push subscription client + SW notification handler |
| Integration diagnostics | MISSING | Explicit configuration/connection errors |
| External secrets | SECURITY BOUNDARY | Never store private API keys in browser; document server-side setup |
| Full customer fields | EXTERNAL CONTRACT | Do not invent unknown official fields |
| Existing Delivery catalog reuse | EXTERNAL CODE BOUNDARY | Current local catalog works; true reuse requires source/contract from Delivery module |

## Invariants

- Fixed ten-item main menu cannot change.
- General sync never sends Orders/Quotes.
- Sales document send remains explicit.
- DEMO must never be presented as the real backend.
- No guessed official URL, token, e-mail or phone.
