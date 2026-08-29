# Handoff — lease revocation repair

## Result

The release blockers from independent verification 4 are repaired in commit
`4e7be66`. The product remains a Rust CLI with the same static companion site
and `dist/site` static deployment class.

## What changed

- Replaced the Ctrl-C-only stop flag with handlers for `SIGINT`, `SIGTERM`,
  and `SIGHUP`.
- Added an internal lease supervisor in its own session. The actual command
  receives its own process group, so every ordinary stop and lease expiry
  revokes the full group, including background descendants.
- On Linux/Unix, the supervisor uses `PR_SET_PDEATHSIG`; if the broker dies,
  it kills the command group and emits a names-only JSON receipt with
  `outcome: broker-parent-died`.
- The broker still emits its normal names-only `broker-stopped` receipt for
  SIGINT, SIGTERM, and SIGHUP, and `lease-expired` for expiry.
- The browser policy helper now rejects duplicate names before creating TOML:
  `TOKEN is approved more than once. Keep one entry.`

## Regression coverage

The single `@claim:broker-stop-revokes` test now starts a command group with a
background descendant and probes SIGINT, SIGTERM, SIGHUP, one-second lease
expiry, and forced broker parent death. It asserts that both group members are
gone and checks the appropriate names-only receipt. A browser regression test
checks that duplicate policy names produce the actionable error and no TOML.

## Verification

Run from a clean checkout:

```sh
npm ci
npm test
npm run typecheck
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
npm audit --audit-level=high
npm run build
cargo package --allow-dirty --locked
```

Evidence from this repair:

- `npm ci` completed with 0 vulnerabilities.
- `npm test` passed: 5 Rust unit tests and 30 Playwright CLI/browser tests.
  It covers desktop and 390 px mobile, keyboard, routes, privacy requests,
  Playwright Axe, service-worker offline reload, and update behavior.
- Every one of the 16 exact commands in `.factory/claims.json` was executed
  after the clean install and passed.
- `cargo fmt --all -- --check`, strict clippy, TypeScript typecheck, and
  `npm audit --audit-level=high` passed.
- `npm run build` produced `dist/site` and `dist/bin/wsb`; site JavaScript is
  13.83 KB raw / 5.13 KB gzip and CSS is 10.95 KB raw / 3.23 KB gzip.
- `cargo package --allow-dirty --locked` passed (51 files; 244.8 KiB unpacked,
  70.5 KiB compressed). A clean local consumer install ran `wsb 0.1.0` and
  `wsb demo --json` successfully.
- The original independent release-binary signal probe now reports
  `sigterm_child_alive: false`, `sighup_child_alive: false`, and a
  `broker-stopped` receipt for each.
- `/opt/fleet/lib/verify-url.sh` passed against the local production preview:
  200 response, correct title/lang/one h1/main/alt text, desktop and 390 px
  screenshots, and no browser errors. The standalone Axe CLI could not start
  Selenium Chrome in this container; the checked-in Playwright Axe integration
  passed on all routes in `npm test`.

## Deployment

Static deployment uses the existing `dist/site` output and
`site/public/staticwebapp.config.json`. Commits `4e7be66` and `a252450` were
pushed to `main` (`a252450b68723f27bbefb7cac71d48a740c00708`). There is no
repository deployment workflow or credential/configuration for a direct static
publish; this repository's deployment contract assigns publishing to the
factory. The live site was checked after the push and still served the prior
`assets/index-Bh2pT44p.js` asset, so factory propagation remains pending.

## Known gaps

The product has no known scope gaps. The external static publish propagation
above remains pending. There is no backend, authentication, analytics, payment
endpoint, or AI runtime to verify. The standalone Axe CLI limitation above is
environmental rather than a site failure; Playwright Axe coverage is the
release check.
