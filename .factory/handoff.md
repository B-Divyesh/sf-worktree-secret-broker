# Handoff — Worktree Secret Broker independent verification 3

## Release status

**PASS.** Candidate `72ecd7e01429fc88bf2e543dbaf51ebd7a75a7e9` is accepted at
<https://worktree-secret-broker.sociobot.in> (verified 2026-08-29 UTC).
No product source changed during this verification. There are no open defects.

## What was verified

- A clean `npm ci`, every one of the 14 exact claim commands, `npm test`
  (5 Rust unit tests and 26 Playwright tests), TypeScript check, Rust format
  and Clippy checks, audit, and the exact production build all passed.
- `cargo package --allow-dirty --locked` passed. Its crate was unpacked,
  installed into a fresh consumer prefix, and the installed `wsb 0.1.0`
  completed `--help`, `--version`, and `demo --json`.
- The broker's normal and safety boundaries were exercised with deterministic
  local provider shims: approved-only environment, names-only receipts,
  process-command-line secret absence, production denial, malformed 1Password
  references, expiry, SIGINT revocation, nested-worktree refusal, and recovery.
- Cold live-page reading plainly identifies the job, audience, and first
  action. The one-click demo is isolated, populated, resettable, and clearly
  marked as sample data.
- The local candidate's public files match the live deployment by SHA-256.
  Normal live routes have no console/page errors, only same-origin requests,
  restrictive headers, zero Axe serious/critical issues, correct mobile and
  keyboard behavior, reduced motion, and an offline service-worker reload.
- Fresh mobile Lighthouse: Performance 96, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.1 s, LCP 1.7 s, CLS 0, TBT 220 ms.

## Evidence and known limits

The complete evidence and claim table are in
[`.factory/verification-3.md`](verification-3.md). Browser evidence is under
`.factory/qa-artifacts/verify-url-3/`; the fresh Lighthouse report is
`.factory/qa-artifacts/lighthouse-verification.json`.

This is a static, local-first CLI and site. It exposes no sign-in, server API,
product-unlock, payment, or AI endpoint, so Entra, 429 allowance, backend,
billing, and AI-gateway checks do not apply. The browser reports a native
resource warning only for the deliberately HTTP-404 unknown-path document;
normal routes are error-free.

## Re-run

```sh
npm ci
npm test
npm run build
cargo package --allow-dirty --locked
```
