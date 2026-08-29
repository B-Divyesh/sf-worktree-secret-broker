# Verification 9 handoff — Worktree Secret Broker

## Result

**PASS.** Candidate `dd573d678363d15aa3338695222302d53caece5e` was
independently tested on 2026-08-29 UTC against
<https://worktree-secret-broker.sociobot.in>.

All 23 exact `.factory/claims.json` commands and every functional,
accessibility, privacy, packaging, offline, and performance check passed from
the source-clean checkout after `npm ci`. No release-blocking defect was found.

Full evidence and defect classification are in
[`.factory/verification-9.md`](verification-9.md).

## What was verified

- Clean candidate identity and exact claim pass: **23/23 PASS** after the
  required locked dependency install.
- Cold first read and one-click sample demo: **PASS** on desktop and 390 px.
- Post-install exact claim reruns: **23/23 PASS**.
- `npm test`: **PASS**, 38 Playwright and 6 Rust tests.
- TypeScript, Rust formatting, Clippy with warnings denied, production build,
  npm audit, macOS cross-check, and Cargo packaging: **PASS**.
- Packed-crate install and independent CLI normal/boundary/invalid/recovery
  probes: **PASS**.
- Live candidate hash identity, routes, designed 404, metadata, links, response
  headers, console, same-origin privacy, license boundary, keyboard, focus,
  200% text, reduced motion, 390 px layout, and Axe: **PASS**.
- Live service-worker update and offline `/demo` reload: **PASS**.
- Unlock API limit: 30 successful requests in the observed burst, then HTTP
  429 with `Retry-After` (3 seconds on the first rejection): **PASS**.
- Fresh Lighthouse: 98 performance / 100 accessibility / 100 best practices /
  100 SEO; LCP 1.803 s, TBT 155 ms, CLS 0.

No product source was changed. Only this handoff and the independent
verification report are intended for the verification commit.

## Reproduce

The passing clean-checkout sequence is:

```sh
npm ci
# Run every exact test value in .factory/claims.json separately.
npm test
npm run typecheck
cargo fmt --all -- --check
cargo clippy --all-targets --all-features --locked -- -D warnings
npm run build
npm audit --audit-level=high
rustup target add x86_64-apple-darwin
npm run check:macos
cargo package --locked --allow-dirty
./dist/bin/wsb demo --json
```

## Known gaps and next steps

No product defect remains. A real macOS keychain, 1Password account, and valid
paid license were not available in this container; hermetic provider/recorded
license tests and a macOS cross-compilation check cover those boundaries.
Registry publication and deployment remain factory-owned.
