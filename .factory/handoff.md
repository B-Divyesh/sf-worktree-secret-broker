# Handoff — independent verification 4

## Result

**FAIL — do not release candidate `930ba0c68b085d57b7f4e3418bc799a59e31228e`.**

Verified on 2026-08-29 UTC against
<https://worktree-secret-broker.sociobot.in>. The live static product matches
the candidate build, so the earlier deployment-only concern is resolved. No
product code was modified during this verification.

## Release blocker

The core short-lived lease does not survive broker termination safely.
`SIGTERM` or `SIGHUP` terminates `wsb`, but its child continues beyond a
one-second lease with the fake secret still present. No revocation receipt is
printed. `SIGINT` behaves correctly and kills the child, which explains why
the current `broker-stop-revokes` claim test passes.

Repair all ordinary termination and parent-death paths so the child process
group cannot outlive its broker. Add claim coverage for `SIGTERM`, `SIGHUP`,
and expiry after broker death.

## Additional defect

The browser policy helper accepts duplicate variable names and generates a
config that `wsb check` rejects with “TOKEN is approved more than once.” Reject
duplicates in the helper or deduplicate them before output.

## Verification summary

- All 16 exact `.factory/claims.json` commands pass after `npm ci`; the broad
  broker-stop claim is nevertheless disproved by the independent signal test.
- Cold first-read and one-click sample demo pass on desktop and 390 px mobile.
- `npm test` passes 5 Rust and 29 Playwright tests.
- Typecheck, fmt, clippy, npm audit, exact build, crate packaging, local clean
  install, and the public Git install all pass.
- The public install resolves to candidate `930ba0c6`; `wsb --help`,
  `wsb --version`, and `wsb demo --json` work.
- All live publishable files match the local production build byte-for-byte.
- Live privacy, headers, cache behavior, routing, keyboard, reduced-motion,
  mobile, Axe, link, service-worker update, and offline reload checks pass.
- Lighthouse: Performance 94, Accessibility 100, Best Practices 100, SEO 100;
  LCP 1.8 s and CLS 0.

## How to reproduce

```sh
npm ci
npm test
npm run build
node .factory/qa-artifacts/verification-4/cli-adversarial.mjs
node .factory/qa-artifacts/verification-4/live-browser-audit.mjs
```

The signal probe cleans up its surviving fake children. Full results,
screenshots, hashes, headers, logs, and Lighthouse JSON are in
`.factory/qa-artifacts/verification-4/`. See `.factory/verification-4.md` for
the exact acceptance evidence and severity rationale.

## Known gaps / next steps

1. Fix the release-blocking signal/parent-death lease behavior.
2. Fix duplicate-name validation in the browser policy helper.
3. Rerun every claim and the independent signal probe before release.

Backend rate limiting, Entra sign-in, and paid-unlock checks are not applicable:
the product has no backend, authentication, payment, or product API endpoint.
