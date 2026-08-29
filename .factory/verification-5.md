# Independent verification 5 — Worktree Secret Broker

**Verdict: FAIL. Candidate `acf1463ab6a281cb7f163da93b52ce56311cfd11` is not releasable.**

- Verified independently on 2026-08-29 UTC.
- Live URL: <https://worktree-secret-broker.sociobot.in>
- Product source changed during verification: **no**.
- The previously reported deployment-only problem is resolved: the live site and public Git install match this candidate.
- Release blocker: the packaged CLI does not compile for its documented macOS Keychain platform.

## Release-blocking finding

### High — documented macOS build fails in Linux-only revocation code

The README documents macOS Keychain support, and the implementation selects
Apple's `security` executable under `cfg!(target_os = "macos")`. However, the
new parent-death protection is guarded by `#[cfg(unix)]` and unconditionally
uses Linux-only `prctl` APIs.

Fresh cross-target evidence from the candidate:

```text
$ cargo check --target x86_64-apple-darwin --locked
error[E0425]: cannot find function `prctl` in crate `libc`
  --> src/lib.rs:378:26
error[E0425]: cannot find value `PR_SET_PDEATHSIG` in crate `libc`
  --> src/lib.rs:378:38
error: could not compile `worktree-secret-broker` (lib) due to 2 previous errors
CARGO_CHECK_MACOS_EXIT=101
```

This means the public `cargo install --git ... --locked` path cannot produce a
macOS binary, so the advertised OS Keychain provider is not usable there. This
is a release blocker for a local CLI whose provider contract explicitly covers
Linux Secret Service and macOS Keychain.

Repair the target guards and provide a macOS-compatible parent-death strategy;
simply omitting `prctl` would weaken the broker-parent-death guarantee. Add at
least macOS cross-target compilation to CI and retain runtime revocation tests
on every supported host. Full compiler evidence is in
`.factory/verification-artifacts/cargo-check-macos.txt`.

## Mandatory first checks

### Claim tests

`.factory/claims.json` exists and contains 16 entries. The literal invocation
before dependency bootstrap stopped at `tsc: not found` (exit 127) for every
entry. Following the required clean-checkout workflow, `npm ci` then installed
the exact lockfile with zero audit findings. Every listed command was rerun
separately before other product QA and passed through the bundled demo entry
points:

| Claim | Installed result |
| --- | --- |
| `demo-isolated` | PASS — 1 selected test |
| `approved-environment` | PASS — 1 selected test |
| `names-only-receipt` | PASS — 1 selected test |
| `production-denied` | PASS — 1 selected test |
| `lease-expiry` | PASS — 1 selected test |
| `worktree-root-required` | PASS — 1 selected test |
| `demo-same-origin` | PASS — 1 selected test |
| `recorded-demo-sample` | PASS — 1 selected test |
| `site-no-analytics` | PASS — 1 selected test |
| `policy-generator` | PASS — 1 selected test |
| `broker-stop-revokes` | PASS — 1 selected test |
| `demo-reset` | PASS — 1 selected test |
| `demo-browser-isolation` | PASS — 1 selected test |
| `recorded-demo-receipt` | PASS — 1 selected test |
| `copy-install-command` | PASS — 1 selected test |
| `one-password-provider` | PASS — 1 selected test |

Each inventory ID has exactly one matching `@claim:<id>` test tag, with no
duplicate or unlisted tags. The landing page, legal pages, demo documentation,
and README were cross-checked against the inventory; no unlisted material
feature, privacy, or quantitative claim was found. Installed command output is
in `.factory/verification-artifacts/claim-tests-after-install.txt`.

### Cold first-read and one-click demo — PASS

A fresh desktop browser context opened the live home page with no state:

- What it does: **“Lease secrets to one worktree process.”**
- For whom: **“For developers running coding agents...”**
- First action: **“Try it with sample data.”**
- Adjacent outcome: **“Opens an isolated recorded CLI run.”**

The action enters the populated sandbox in one click. Its persistent banner
says “Demo — sample data, nothing is saved to your real data” and provides
**Reset demo** and **Start for real**. The same action is visible in the first
390×844 screen. Screenshots are `cold-live-desktop.png` and
`live-mobile-390.png` in the verification artifact directory.

## Clean install, gates, build, and packaging

The candidate checkout began at the exact requested SHA; `origin/main` also
pointed to it. After the lockfile install:

| Gate | Result |
| --- | --- |
| `npm ci` | PASS — 24 packages, 0 vulnerabilities |
| `npm test` | PASS — 5 Rust unit tests, doc tests, 30 Playwright tests |
| `npm run typecheck` | PASS |
| `cargo fmt --all -- --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run build` | PASS — `dist/site/` and `dist/bin/wsb` produced |
| `cargo package --allow-dirty --locked` | PASS — 51 files, 70.5 KiB compressed |
| Linux clean-consumer install from packed crate | PASS |
| Public README Git install | PASS — resolved `acf1463a`, `wsb 0.1.0` |
| `cargo check --target x86_64-apple-darwin --locked` | **FAIL — exit 101** |

The clean consumer provided useful `--help`, ran `wsb demo --json`, and removed
the reported temporary worktree. The public install independently proves that
the repository's install path currently resolves the tested candidate.

## Independent Linux CLI behavior

The release binary was exercised with a temporary Git repository and a fake
local provider. No real credentials were used.

| Case | Result |
| --- | --- |
| Approved value reaches child; unrelated `CI` and token are cleared | PASS |
| Receipt and Git diff omit resolved value | PASS |
| Broker/leader/descendant command lines omit resolved value | PASS |
| Provider failure, then corrected provider | PASS recovery |
| Nested worktree directory | PASS refusal, exit 1 |
| Lease 0 and 1,441 minutes | PASS refusal |
| Lease 1,440 minutes | PASS acceptance |
| Case-insensitive production label | PASS default denial |
| Explicit `--allow-production` | PASS |
| Child exit 37 | PASS propagation in status and receipt |
| One-second expiry | PASS, exit 124 and `lease-expired` |
| SIGINT, SIGTERM, and SIGHUP | PASS; leader and descendant gone |
| Forced broker death | PASS; group gone and `broker-parent-died` receipt |
| Two simultaneous leases | PASS |
| `init` overwrite | PASS refusal with recovery text |

This confirms that the earlier Linux lease-revocation defect is repaired. The
fresh matrix is in `cli-independent-result.json`.

## Live deployment and browser QA

- **Candidate identity:** SHA-256 matches for all route HTML, the designed 404,
  JS, source map, CSS, fonts, images, icons, robots, sitemap, and service
  worker. Public source install also resolves `acf1463a`.
- **Routes:** `/`, `/demo`, `/privacy`, and `/terms` return 200. An unknown path
  returns the designed document with HTTP 404. Normal routes have no console,
  page, or request errors. Chromium logs only the expected failed-document
  message for the intentional 404 response.
- **Privacy:** the full home → demo → reset → exit → invalid/duplicate/valid
  policy flow made same-origin requests only. It set no cookie, made no
  analytics request, preserved non-demo sentinels, and removed all `demo:`
  state on exit.
- **Headers:** live responses have a self-only CSP with
  `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrer policy, and
  restrictive camera/microphone/geolocation policy.
- **Caching:** route HTML and `sw.js` revalidate after 30 seconds; hashed JS and
  CSS are immutable for one year; a conditional JS request returned 304.
- **Accessibility:** all five routes have `lang=en`, one `h1`, one `main`, no
  heading skips, and no missing image alternatives. Axe found zero violations
  at any impact level. The factory `verify-url.sh` passed home and demo.
- **Keyboard:** all 17 interactive/focusable controls were reached in order.
  Each has a visible 3 px coral focus outline. The policy form reports invalid
  and duplicate input in its live region and recovers after correction.
- **Mobile/reflow:** at 390×844 the main action is visible, no target is under
  44×44 CSS px, and there is no horizontal overflow. Doubling the root text
  size to 200% still produces no horizontal overflow.
- **Reduced motion:** the media query matches, remaining durations are 0.001 ms,
  the only animation is finished, and scrolling is automatic rather than
  animated.
- **Links:** every rendered HTTP link returned 200; the privacy `mailto:` was
  correctly excluded.
- **Service worker:** `registration.update()` completed with no waiting worker,
  cache `wsb-site-v3` controlled the page, and `/demo` reloaded offline with its
  title, heading, and banner.

## Performance and budgets

Fresh Lighthouse 13.0.1 mobile results against the live URL:

| Category / metric | Result |
| --- | ---: |
| Performance | 97 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| First Contentful Paint | 1.32 s |
| Largest Contentful Paint | 1.81 s |
| Total Blocking Time | 173 ms |
| Cumulative Layout Shift | 0 |
| Total transfer | 192,541 bytes |

Static budgets pass: JavaScript is 13,830 bytes raw / 5,164 bytes gzip; CSS is
10,945 / 3,242 bytes; fonts total 102,036 bytes; the hero WebP is 79,942 bytes.
Lighthouse reported no run warnings. Lab INP is not available; TBT is shown as
the responsiveness proxy.

## Applicability

This product has a local Rust CLI and static companion site. Source and runtime
traffic show no server-side product endpoint, unlock endpoint, sign-in,
analytics, payment, or AI runtime. Endpoint allowance/429, backend persistence,
health/build identity, and Entra authority checks are therefore not
applicable. AI would add risk without helping this deterministic secret
boundary.

## Retest requirement

1. Make the packaged CLI compile on macOS without weakening parent-death
   revocation.
2. Add supported-target compilation coverage and, where possible, macOS
   provider/revocation runtime coverage.
3. Rerun all 16 claim commands, full build/package/consumer checks, Linux
   revocation matrix, macOS target check, and live deployment comparison.
