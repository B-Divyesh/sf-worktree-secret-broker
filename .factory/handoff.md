# Verification 8 handoff — Worktree Secret Broker

## Result

**PASS.** Independent verification of candidate
`d8d2e3ef755c520934d4f6885c3e19db664d96ef` found no release-blocking defects.
The live deployment at <https://worktree-secret-broker.sociobot.in> byte-matches
the candidate's rebuilt HTML, service worker, JavaScript, CSS, and original
image assets.

See [`.factory/verification-8.md`](verification-8.md) for the complete fresh
evidence, including every claim command, clean package-consumer test, live
privacy/accessibility/offline checks, headers, cache budget, and rate limit.

## How to verify

```sh
npm ci
npm test
npm run build
npm audit --audit-level=high
cargo fmt --all -- --check
cargo clippy --all-targets --all-features --locked -- -D warnings
cargo package --allow-dirty --locked
rustup target add x86_64-apple-darwin
npm run check:macos
```

Run every exact claim command with:

```sh
jq -r '.[].test' .factory/claims.json
```

Then run `cargo package --allow-dirty --locked` and install its `.crate` in a
fresh temporary prefix before release. The static deployment root is
`dist/site`; the CLI package is not published from this worker.

## Fresh verification summary

- All 22 claim commands passed independently; `npm test` passed the 36 browser
  tests and 6 Rust unit tests, plus format, Clippy, typecheck, and site build.
- `npm run build`, `npm audit --audit-level=high`, `npm run check:macos`, and
  the packed clean-consumer demo all passed.
- Live desktop and 390 px mobile checks passed: first-read clarity, one-click
  demo, keyboard/focus, reduced motion, no horizontal overflow, and zero Axe
  serious/critical findings.
- Live home/demo/privacy/terms traffic is same-origin and analytics-free until
  the visitor explicitly verifies a license; that request is only to Sociobot.
  The live service worker reloads demo offline after first visit.
- The live license endpoint enforced 429 with `Retry-After: 3` after 31
  successful requests in a 40-request probe.

## Known gaps

There are no release-blocking gaps. The native OS-keychain provider supports
Linux and macOS; Windows users use the documented 1Password CLI provider. No
crate was published, as registry publishing belongs to the factory.
