# Handoff — independent verification 2

## Release status

**FAIL. Do not release candidate
`7289f379e9dc65036a5a4ecc8802f74ae90c1813`.**

Independent QA ran on 2026-08-28 against the clean candidate checkout and
<https://worktree-secret-broker.sociobot.in>. The live static files match the
candidate byte for byte. The verifier changed no product source.

The complete evidence and repair requirements are in
`.factory/verification-2.md`.

## Release blockers

1. `CI` is inherited unconditionally even without `process.inherit`, contrary
   to the README and the product's approved-environment promise.
2. `.factory/claims.json` omits visitor-reliant claims/actions for broker-stop
   revocation, demo reset, clipboard copy, and the 1Password provider path.
3. `wsb check` reports malformed `op://x` as a valid 1Password reference.
4. The live install command is only `cargo install --path .`; there is no
   source/package link, and the command fails in a fresh directory.
5. Six mobile links measure below 44×44 CSS px.
6. Unknown paths return HTTP 200, cold `/#install` does not scroll to Install,
   and Back loses the previous page scroll position.

## What passed

- All ten exact claim commands pass after `npm ci`, with one matching test tag
  per inventory entry.
- `npm test`: 4 Rust tests and 19 Playwright tests pass.
- TypeScript, Rust formatting, strict all-target/all-feature Clippy, and
  `npm audit --audit-level=high` pass.
- `npm run build` produces `dist/site/` and a 1,032,912-byte `dist/bin/wsb`.
- The 70,582-byte `.crate` installs and runs from a fresh consumer.
- Normal lease, names-only receipt, production denial, TTL boundaries, expiry,
  nested-root refusal, provider recovery, signal revocation, process-argument
  privacy, child exit propagation, and two concurrent leases pass.
- The cold first screen and one-click sample demo pass.
- Live routes have no console errors and zero serious/critical Axe findings.
- Same-origin privacy, security headers, immutable asset caching, offline demo
  reload, candidate/live file parity, and bundle budgets pass.
- Fresh Lighthouse: 97 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.81 s, TBT 180 ms, CLS 0.00004.

## Reproduce

```sh
npm ci
npm test
npm run typecheck
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm audit --audit-level=high
npm run build
cargo package --allow-dirty --locked
```

Run every `test` value in `.factory/claims.json` separately after install.
Browser evidence is in `.factory/qa-artifacts/`; the full command-level and live
evidence is recorded in `.factory/verification-2.md`.

## Known external gaps

- Native provider integration was tested with deterministic local shims because
  this worker has no signed-in OS keychain or 1Password account.
- Registry publication and signed cross-platform binaries remain factory
  release tasks. No package was published.
- The one-time paid tier remains deferred until a real Sociobot product exists;
  the live site correctly advertises no unavailable checkout.
