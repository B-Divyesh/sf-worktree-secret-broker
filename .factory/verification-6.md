# Independent verification 6 — Worktree Secret Broker

**Verdict: PASS.** Candidate `bf8468874207e7cb410ef13f93742c38d1c001d1` is releasable.

- Verified independently on 2026-08-29 UTC from a clean checkout at that
  exact commit.
- Live URL: <https://worktree-secret-broker.sociobot.in>
- Product source changed during verification: **no**. Only this report and the
  handoff were added afterwards.

## First read and demo

A cold desktop load answers the mandatory questions in plain language:

- **What:** “Lease secrets to one worktree process.”
- **Who:** “For developers running coding agents...”
- **First click:** **Try it with sample data**, with the adjacent outcome
  “Opens an isolated recorded CLI run.”

The one-click action enters the populated `/ ?demo=1` sandbox. It presents the
persistent “Demo — sample data, nothing is saved to your real data” banner,
**Reset demo**, and **Start for real**. Demo reset retains only
`sessionStorage["demo:session"]`; Start for real removes all `demo:` keys and
does not change real-data sentinels.

## Required claim gate

`.factory/claims.json` exists with 16 entries. After `npm ci` (24 packages,
0 npm audit vulnerabilities), I executed every listed exact command separately
from this checkout through its shipped demo entry point. Every command passed:

| Claim IDs with passing `npm test -- --grep @claim:<id>` command |
| --- |
| `demo-isolated`, `approved-environment`, `names-only-receipt`, `production-denied` |
| `lease-expiry`, `worktree-root-required`, `demo-same-origin`, `recorded-demo-sample` |
| `site-no-analytics`, `policy-generator`, `broker-stop-revokes`, `demo-reset` |
| `demo-browser-isolation`, `recorded-demo-receipt`, `copy-install-command`, `one-password-provider` |

The full `npx playwright test --reporter=list` then passed **30/30** in 31.1 s.
It covers normal and invalid policy generation/recovery, provider mapping,
cleared environments, production denial, nested-root refusal, expiry and all
broker-stop signals, descendant cleanup, demo isolation/reset, offline reload,
accessibility, keyboard operation, and mobile reflow.

## Local quality and consumer evidence

| Check | Result |
| --- | --- |
| `cargo test --locked` | PASS — 5 unit tests, 0 failures; doc tests pass |
| `npm run typecheck` | PASS |
| `cargo fmt --all -- --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm run check:macos` | PASS after installing the clean container's missing `x86_64-apple-darwin` Rust target |
| `npm run build` | PASS — deployable `dist/site/` and `dist/bin/wsb` (993 KiB) |
| `cargo package --allow-dirty --locked` | PASS — 51 files, 71.2 KiB compressed |
| clean-consumer install | PASS — unpacked crate installed with `cargo install --path ... --root <temp> --locked`; installed `wsb --help` and `wsb demo --json` worked |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |

The packed consumer's demo returned the names-only receipt for `DATABASE_URL`
and `NPM_TOKEN` and removed its reported temporary worktree. This is the
product's public CLI surface exercised independently, without real secrets.

## Live deployment and browser QA

- **Candidate identity:** live and locally built SHA-256 values match for
  `index.html`, `assets/index-Cn21DOj6.js`, `assets/index-DVfGD9a3.css`, and
  `sw.js`. The deployed static product is this candidate.
- **Privacy:** a fresh home → demo → reset → exit → invalid/valid policy flow
  requested only `https://worktree-secret-broker.sociobot.in`. It created no
  cookies, local storage, analytics, or third-party requests. The policy helper
  rejected `TOKEN TOKEN` with a clear recovery message, then produced a
  development-only `SERVICE_TOKEN` reference.
- **Routes and accessibility:** `/`, `/demo`, `/privacy`, `/terms`, and the
  designed `/missing` page each had one `main`, one `h1`, and the correct
  route title. Axe found zero serious or critical violations on every route;
  normal routes had no console or page errors. A direct 404 response naturally
  produces Chrome's failed-document network diagnostic while rendering the
  designed 404 page; it is not an application console/page error.
- **Keyboard, motion, mobile:** Tab starts at the skip link; focus outlines
  are visible and policy controls work with keyboard. At 390×844 the demo has
  no horizontal overflow (390 px scroll width), and the Reset control is
  118×44 px. Reduced-motion style duration is effectively zero. Offline reload
  works after the service worker controls `/demo`.
- **Headers and caching:** all live responses use self-only CSP including
  `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrer policy and
  restrictive permissions policy. HTML/SW revalidate at 30 seconds; hashed JS
  is one-year immutable and a conditional request returned 304. Internal and
  external rendered HTTP links returned 200.
- **Budgets:** built JS is 5,164 B gzip; CSS is 3,242 B gzip; hero image is
  80 KiB; all are within the product budgets. Fresh Lighthouse mobile gathered
  Performance 98 and Accessibility 100 (FCP 1.1 s, LCP 1.9 s, TBT 140 ms,
  CLS 0). Playwright Chromium subsequently crashed while Lighthouse captured a
  full-page screenshot, after scores were computed; independent Playwright
  page loads did not crash.

## Applicability and defects

There is no product backend, sign-in, payment/unlock call, analytics endpoint,
or other server-side product API. Therefore Entra authority, endpoint
allowance/429, concurrency, persistence, and health/build-identity probes are
not applicable. The browser and CLI use no AI feature.

**Defects by severity: none.** The former macOS compilation release blocker is
resolved: the exact documented cross-target check now passes.
