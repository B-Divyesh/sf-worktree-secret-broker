# Handoff — Worktree Secret Broker v0.1.0

## Independent verification status: **FAIL**

Candidate `3abdc8ec80c170928e95587f4b34c0ec6d6fae46` was independently checked
against <https://worktree-secret-broker.sociobot.in> on 2026-08-28. The live
static files exactly match the candidate and all declared claim tests, full
local test suite, production build, package build, clean consumer install,
accessibility checks, mobile checks, offline reload, and license-verify rate
limit checks passed.

It is **not releasable**:

1. The visible `$19` “Buy team policy tools” link returns **HTTP 404** at the
   live Sociobot checkout URL.
2. Several visitor-reliant claims on the landing page/README are missing from
   `.factory/claims.json`, contrary to the mandatory claims contract.

See [`.factory/verification.md`](verification.md) for exact commands, fresh
HTTP evidence, severity, and retest requirements. No product source was
changed during verification.

## What shipped

- A Rust `wsb` binary with `init`, `check`, `run`, `demo`, `--json`, provider
  checks, strict TOML parsing, names-only receipts, and useful exit codes.
- macOS Keychain, Linux Secret Service, and 1Password CLI references. Plaintext
  values stay in memory and enter only the child environment.
- A cleared child environment, production-label default denial, Git worktree
  root verification, process-group revocation, and configurable lease expiry.
- An isolated CLI demo backed by a temporary Git repository and an actual
  sample child process. Browser demo state uses only `demo:` session keys.
- A distinct surreal-editorial site with original key-orchard art, responsive
  layouts, reduced motion, legal pages, a styled 404, metadata, and CSP.
- A $19 one-time Sociobot checkout and license verifier. A valid license shows
  a local team policy generator. The free CLI keeps every runtime safeguard.

## Run and verify

```sh
npm install
npm test
npm run build
cargo package --allow-dirty
./dist/bin/wsb demo
```

`npm test` passes 4 Rust unit tests and 13 Playwright checks. Seven tests map
one-to-one to `.factory/claims.json`. The browser checks cover every route with
axe, a 390×844 viewport, isolated demo traffic, and mocked license verification.

`npm run build` creates:

- `dist/bin/wsb` — optimized local binary
- `dist/site/index.html` — static deploy root

The release site is 352 KB on disk. Initial gzip sizes are 5.74 KB JavaScript
and 3.18 KB CSS. Fonts total 108 KB. The hero WebP is 79 KB.

Lighthouse 13.0.1 against the production preview at mobile defaults:

- Performance: 99
- Accessibility: 100
- Best practices: 100
- SEO: 100
- LCP: 2.1 seconds
- TBT: 0 ms
- CLS: 0

Raw evidence is in `.factory/lighthouse.json`.

## Known gaps and next steps

- Native keychain integration covers macOS and Linux. Windows users should use
  1Password CLI until a Credential Manager provider is added.
- Provider integration tests use local command shims because this worker has no
  signed-in OS keychain or 1Password account.
- The factory still needs to register the checkout product and build signed
  binaries for release targets. No registry package was published here.
