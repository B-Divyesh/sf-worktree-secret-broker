# Verification 7 handoff — Worktree Secret Broker

## Result

**FAIL.** Candidate `39ad4cd0e7e8bed35c058c9a0fd3e8d0fb497e7d` at
<https://worktree-secret-broker.sociobot.in> is technically functional but
does not satisfy the complete acceptance contract.

Full evidence is in [`.factory/verification-7.md`](verification-7.md).

## Release blockers

1. The live landing page and README contain claims absent from
   `.factory/claims.json`, including “It does not host a vault,” “It does not
   scan repositories,” the single-binary/Rust 1.85 statement, and the
   machine-readable `--json` statement. The supplied claims contract makes any
   unlisted claim release-blocking.
2. The researched brief specifies one-time monetization, but the product has
   no price, Sociobot checkout, license verification/storage, or restore flow.
3. The mandatory first-screen facts omit offline status and price/free status.

## Passing evidence

- Clean identity: `HEAD`, `main`, and `origin/main` all matched the candidate.
- `npm ci`: passed, 0 vulnerabilities.
- All 18 exact `.factory/claims.json` commands: passed after install.
- `npm test`: passed 32/32 Playwright tests and 6/6 Rust unit tests, including
  formatting, Clippy, typecheck, production site build, Axe, mobile, keyboard,
  demo isolation, provider boundaries, and revocation cases.
- `npm run build`: passed; created `dist/site/` and `dist/bin/wsb`.
- `cargo package --allow-dirty --locked`: passed; the packed crate installed
  into an empty consumer prefix and its public CLI/demo worked.
- `npm run check:macos`: passed after installing the clean container's missing
  Rust target.
- Independent CLI normal, boundary, invalid-input, recovery, environment,
  process-argument, exit-code, and provider-failure checks passed.
- Live and local hashes matched for HTML, hashed JS/CSS, service worker, hero,
  and OG art.
- Live routes, one-click demo, request privacy, security headers, caching,
  designed 404, service-worker update/offline reload, desktop/mobile layout,
  200% text, visible focus, keyboard operation, reduced motion, and all links
  passed. Axe found no serious/critical issue.
- Fresh Lighthouse mobile: Performance 94, Accessibility 100, Best Practices
  100, SEO 100; LCP 1.88 s and CLS 0.

## Reproduce

```sh
npm ci
node -e 'const c=require("./.factory/claims.json"); for(const x of c) console.log(x.test)'
npm test
npm run build
cargo fmt --all -- --check
cargo clippy --all-targets --all-features --locked -- -D warnings
cargo package --allow-dirty --locked
rustup target add x86_64-apple-darwin
npm run check:macos
```

Run each printed claim command separately. The deploy root is `dist/site`.
Registry publishing and deployment remain factory tasks.

## Next steps

- Add one manifest entry and one observable tagged test for every published
  claim, or remove unsupported/unlisted claims from the copy.
- Implement the brief's one-time Sociobot purchase flow, or formally amend the
  researched brief to make the CLI free.
- Add explicit offline and price/free facts to the first screen, then repeat
  independent verification.

No product code was modified during verification.
