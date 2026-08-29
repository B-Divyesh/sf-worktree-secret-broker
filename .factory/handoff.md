# Handoff — verification 6

## Result

**PASS — candidate `bf8468874207e7cb410ef13f93742c38d1c001d1` is releasable.**
Independent verification on 2026-08-29 confirmed the live static deployment
at <https://worktree-secret-broker.sociobot.in> is byte-identical to the
candidate for its HTML, JS, CSS, and service-worker assets. No product source
was modified during verification.

The previous macOS release blocker is resolved. After installing the clean
container's missing Rust standard target, the exact documented
`npm run check:macos` command passed.

## Verification summary

- All 16 exact claim commands in `.factory/claims.json` passed after `npm ci`.
- `cargo test --locked` (5 tests), `npx playwright test` (30/30), typecheck,
  fmt, Clippy, macOS cross-target check, audit, and `npm run build` passed.
- `cargo package --allow-dirty --locked` passed. An unpacked package installed
  into a clean temporary consumer; its `wsb --help` and `wsb demo --json`
  worked and the demo removed its temporary worktree.
- Live demo traffic stayed same-origin; no analytics/third-party requests or
  cookies were observed. Demo state uses only `demo:` session keys and is
  removed by Start for real.
- Live routes meet semantic, keyboard, responsive, reduced-motion, service
  worker/offline, security-header, and zero-serious/critical-Axe checks.
- Performance budgets pass: 5,164 B gzip JS, 3,242 B gzip CSS, 80 KiB hero.
  Fresh mobile Lighthouse gathered Performance 98 and Accessibility 100.

Read the full evidence, exact claim inventory, scope decisions, and defect
severity in `.factory/verification-6.md`.

## Defects and known gaps

**No release defects.** There is no backend, sign-in, billing/unlock, or
product API, so rate-limit/429, Entra, persistence, and server concurrency
checks do not apply. macOS runtime behavior still requires a macOS host; its
supported target now compiles and Linux runtime revocation coverage passes.

## Run and verify

```sh
npm ci
npm test
npm run check:macos
npm run build
cargo package --allow-dirty --locked
```

Use `wsb demo` for the isolated CLI demo or open
`https://worktree-secret-broker.sociobot.in/?demo=1` for the browser sandbox.

---

# Prior repair context — repair 5

## Result

This repair addressed the earlier macOS compilation blocker in candidate
`acf1463ab6a281cb7f163da93b52ce56311cfd11`.

The exact failure was reproduced before the repair:

```text
$ rustup target add x86_64-apple-darwin
$ cargo check --target x86_64-apple-darwin --locked
error[E0425]: cannot find function `prctl` in crate `libc`
error[E0425]: cannot find value `PR_SET_PDEATHSIG` in crate `libc`
```

## Repair

- Linux keeps `prctl(PR_SET_PDEATHSIG, SIGTERM)` and its fork-to-setup race
  check.
- macOS now starts the supervisor in its own session, registers a `kqueue`
  `EVFILT_PROC`/`NOTE_EXIT` watch for the broker before starting the leased
  command, and routes a broker exit through the existing complete child
  process-group revocation path. It fails closed if the broker died during
  watcher setup.
- Process-group creation and revocation are now explicitly limited to the two
  supported native-provider targets, Linux and macOS. Linux-only `prctl`
  symbols are compiled only on Linux.
- `npm run check:macos` is the exact cross-target regression command.
  `.github/workflows/ci.yml` installs `x86_64-apple-darwin` and runs that
  command on every push and pull request. The README documents it.

## Verification

All checks below ran from this repair worktree after `npm ci`:

```text
npm ci                                              PASS (24 packages, 0 vulnerabilities)
npm run check:macos                                 PASS
npm test                                            PASS (5 Rust unit tests; 30 Playwright tests)
npm run typecheck                                   PASS
cargo fmt --all -- --check                          PASS
cargo clippy --all-targets --all-features -- -D warnings  PASS
npm audit --audit-level=high                        PASS (0 vulnerabilities)
npm run build                                       PASS (dist/site and dist/bin/wsb)
cargo package --allow-dirty --locked                PASS (51 files; 71.2 KiB compressed)
fresh unpacked-crate cargo install --locked         PASS
installed wsb --help; installed wsb demo --json     PASS
```

The macOS regression command was run again after the change and completed
successfully. The full Linux broker-stop claim still exercises SIGINT,
SIGTERM, SIGHUP, expiry, forced broker death, leader cleanup, descendant
cleanup, and the `broker-parent-died` receipt.

Each required claim command was replayed from the shipped demo/test entry
point and passed: `demo-isolated`, `approved-environment`,
`names-only-receipt`, `production-denied`, `lease-expiry`,
`worktree-root-required`, `demo-same-origin`, `recorded-demo-sample`,
`site-no-analytics`, `policy-generator`, `broker-stop-revokes`, `demo-reset`,
`demo-browser-isolation`, `recorded-demo-receipt`, `copy-install-command`,
and `one-password-provider`.

The full Playwright run covers desktop, 390 px mobile/reflow, keyboard skip
link and policy-helper operation, every route's console/error baseline and
serious/critical Axe scan, service-worker offline reload, reduced motion,
privacy request isolation, and updateable static output. The test suite uses
the bundled Playwright Axe integration, so no external runtime script is
loaded. Production static output remains under `dist/site/`.

## Deployment

Deployment class is unchanged: static. The repair was pushed to `main` as
`cb13d404b77978ff44c439e2de26587cdc76db61`; its CI browser-setup follow-up is
`5b4c97f9e0c4a467802b0659b1348247c70c5784`. GitHub Actions run
`33242554857` for the latter completed successfully with the macOS target
check, full test, production build, and package steps. The configured static
deployment consumes `dist/site/`; this CLI-only repair leaves its generated
site files byte-identical. The live static root returned HTTP 200 with the
existing CSP, HSTS, no-sniff, referrer-policy, and permissions-policy headers
after the push.

## Known gaps

The Linux worker cannot execute a native macOS process test. The macOS code is
compiled by the exact failing target check in CI; its runtime design uses the
platform-native `kqueue` parent-exit facility and preserves the tested Linux
forced-death/process-group behavior. No backend, analytics, payment, AI, or
external product runtime applies to this local CLI and static documentation
site.
