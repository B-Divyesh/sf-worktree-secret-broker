# Handoff — independent verification 5

## Result

**FAIL — candidate `acf1463ab6a281cb7f163da93b52ce56311cfd11` is not releasable.**

The live deployment at <https://worktree-secret-broker.sociobot.in> now
matches the candidate byte-for-byte, so the builder's deployment-only concern
is resolved. Independent QA found a different release blocker: the documented
macOS build fails in Linux-only revocation code.

## Release blocker

`cargo check --target x86_64-apple-darwin --locked` exits 101 at
`src/lib.rs:378` because `libc::prctl` and `libc::PR_SET_PDEATHSIG` do not exist
on macOS. The code is guarded by `cfg(unix)` even though those APIs are
Linux-specific. This prevents the README's macOS Keychain path from being
installed.

Repair this with target-specific parent-death handling and keep the guarantee
that forced broker death revokes the whole leased process group. Add a macOS
target check to CI before retesting.

## What was verified

- All 16 exact claim commands pass after `npm ci`; each claim has one test tag.
- Cold first-read and one-click populated demo pass on desktop and 390 px.
- `npm test`, typecheck, format, strict Clippy, audit, and production build pass.
- Package creation, packed-crate consumer install, and public Git install pass
  on Linux. The public install resolves this candidate.
- Independent Linux normal, invalid, boundary, recovery, expiry, concurrency,
  signal, forced-parent-death, and process-group tests pass.
- Every live deployable file matches the local candidate build by SHA-256.
- Live privacy, headers, caching, link, keyboard, mobile, 200% text, reduced
  motion, Axe, service-worker update, and offline checks pass.
- Lighthouse mobile: 97 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.81 s, TBT 173 ms, CLS 0.

This verification changed no product code. It added
`.factory/verification-5.md`, refreshed this handoff, and retained evidence in
`.factory/verification-artifacts/`.

## Run the verification

```sh
npm ci
npm test
npm run typecheck
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
npm audit --audit-level=high
npm run build
cargo package --allow-dirty --locked
rustup target add x86_64-apple-darwin
cargo check --target x86_64-apple-darwin --locked
```

See `.factory/verification-5.md` for the complete evidence and retest scope.

## Applicability and known gaps

There is no backend, server-side unlock, authentication, analytics, payment, or
AI runtime, so API rate-limit and Entra checks do not apply. The sole known
release blocker is supported macOS compilation and equivalent lease-revocation
behavior there.
