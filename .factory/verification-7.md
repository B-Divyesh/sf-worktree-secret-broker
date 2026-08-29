# Independent verification 7 — Worktree Secret Broker

**Verdict: FAIL.** Candidate
`39ad4cd0e7e8bed35c058c9a0fd3e8d0fb497e7d` is not releasable under the
supplied acceptance contract.

- Verified independently on 2026-08-29 UTC from a clean checkout at the exact
  candidate commit; `HEAD`, `main`, and `origin/main` matched.
- Live URL: <https://worktree-secret-broker.sociobot.in>
- Product source changed during verification: **no**. Only this report and the
  handoff were changed after testing.

## Release-blocking findings

### High — V7-1: live and README claims are missing from the claim manifest

The supplied claims contract says every visitor-reliant claim must have one
entry in `.factory/claims.json` and exactly one tagged sandbox test. It also
says any unlisted claim fails verification.

The live landing page states:

- “It does not host a vault.”
- “It does not scan repositories.”

The README additionally states:

- “Install the single binary from its public source with Rust 1.85 or newer.”
- “Use `--json` for machine-readable checks and receipts.”

None has a corresponding entry in `.factory/claims.json`. A mechanical audit
found 18 manifest entries and exactly 18 matching test tags, so this is not a
duplicate-tag issue: these claims are outside the manifest. Some behavior is
incidentally exercised elsewhere, but the contract requires a dedicated
manifest entry and one tagged test per claim. Remove the statements or add
the missing claim entries and observable sandbox tests.

### High — V7-2: the researched one-time purchase is not implemented

The researched brief specifies one-time monetization, and the attached paid
unlock contract requires an exact price, hosted Sociobot checkout link,
license capture/verification, and purchase restore. The live product has no
price, buy link, restore field, license storage, or Sociobot verification
request. The browser test suite deliberately asserts that no checkout is
advertised, while the README presents the CLI as MIT-licensed source.

This is a usable free CLI, but it does not implement the supplied monetization
contract. Either implement the one-time Sociobot unlock flow or formally
change the product brief.

### Medium — V7-3: mandatory first-screen fact categories are incomplete

The first screen has three useful safety facts, but the supplied plain-words
contract requires short privacy, offline, and price facts. It gives no offline
status and no price/free statement. This overlaps the absent purchase flow but
is independently visible on the cold first screen.

## Mandatory first read and demo

The explicit first-read gate itself passes:

- **What:** “Lease secrets to one worktree process.”
- **Who:** “For developers running coding agents...”
- **First click:** **Try it with sample data**, followed by “Opens an isolated
  recorded CLI run.”

All three answers are above the fold on desktop and 390 px mobile. One click
opens the populated `?demo=1` sandbox with the persistent “Demo — sample data,
nothing is saved to your real data” banner, **Reset demo**, and **Start for
real**.

## Required claim gate

`.factory/claims.json` exists with 18 entries. After the documented clean
install (`npm ci`, 24 packages, 0 vulnerabilities), I ran every listed command
separately. All 18 passed:

| Passing exact claim commands |
| --- |
| `demo-isolated`, `approved-environment`, `names-only-receipt`, `production-denied` |
| `lease-expiry`, `worktree-root-required`, `demo-same-origin`, `recorded-demo-sample` |
| `site-no-analytics`, `policy-generator`, `broker-stop-revokes`, `demo-reset` |
| `demo-browser-isolation`, `recorded-demo-receipt`, `copy-install-command`, `one-password-provider` |
| `os-keychain-provider`, `policy-helper-input-boundary` |

For transparency, invoking the first claim command before installing declared
Node dependencies reached the typecheck and failed with `tsc: not found`.
After the required `npm ci`, every exact claim command passed. This was an
environment setup prerequisite, not a product failure.

Every manifest ID occurs exactly once as `@claim:<id>` in
`tests/product.spec.ts`; there are no orphan claim tags. V7-1 concerns claims
in the published copy that are absent from the manifest.

## Clean build, tests, and packaged consumer

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 24 packages; 0 vulnerabilities |
| all 18 exact manifest commands | PASS |
| `npm test` | PASS — 32/32 Playwright tests, 6/6 Rust unit tests, doc tests, formatting, Clippy, typecheck, site build |
| `npm run build` | PASS — `dist/site/` and `dist/bin/wsb` (1,016,776 bytes) |
| `cargo fmt --all -- --check` | PASS |
| `cargo clippy --all-targets --all-features --locked -- -D warnings` | PASS |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `cargo package --allow-dirty --locked` | PASS — 249.7 KiB unpacked, 71.6 KiB compressed |
| `npm run check:macos` | PASS after installing the clean container's missing `x86_64-apple-darwin` target |
| clean consumer install | PASS — installed the packed crate into an empty prefix; `--help`, `--version`, and `demo --json` worked |

The installed consumer demo returned the expected names-only receipt for
`DATABASE_URL` and `NPM_TOKEN`; its reported temporary worktree was gone after
exit.

## Independent CLI exercise

The release binary passed independent normal, boundary, invalid, and recovery
cases beyond the repository suite:

- `init` created a nested config path and refused to overwrite it.
- `check --json` accepted a development-only OS-keychain mapping.
- A real run in a fresh Git worktree received the fake provider value while an
  unrelated parent sentinel was absent; the value was absent from the receipt.
- Child exit 23 propagated as CLI exit 23 and `child_exit_code: 23`.
- Lease boundaries accepted 1440 and rejected 0/1441; runtime `--ttl` rejected
  0/1441 and accepted 1.
- Invalid environment names, provider references, malformed TOML, missing
  worktrees, missing commands, and provider failure returned nonzero with
  actionable errors.
- Production was denied by default and accepted only with the explicit
  `--allow-production` flag.
- While a leased child was running, broker, supervisor, and child command
  lines contained only the approved variable name; the resolved value was
  absent. SIGTERM produced a `broker-stopped` receipt.

The shipped tests additionally proved SIGINT, SIGTERM, SIGHUP, one-second
expiry, and abrupt broker-parent death revoke the complete descendant process
group.

## Live deployment, privacy, and accessibility

- **Candidate identity:** SHA-256 matched between local `dist/site` and live
  responses for `index.html`, hashed JS, hashed CSS, `sw.js`, hero art, and OG
  art. The deployed product is this candidate.
- **Privacy:** a fresh home → demo → reset → exit → invalid/valid policy flow
  requested only `https://worktree-secret-broker.sociobot.in`, set no cookies,
  and made no analytics or third-party request. Real local/session sentinels
  survived; reset and exit changed only `demo:` session keys.
- **Routes:** `/`, `/demo`, `/?demo=1`, `/privacy`, and `/terms` returned 200
  with `lang=en`, one main, one h1, route-specific titles, no console/page
  errors, and zero serious/critical Axe findings. The designed unknown route
  returned a true 404, one main/h1, and zero serious/critical Axe findings;
  Chromium logged only the expected failed-document 404 diagnostic.
- **Factory verifier:** `/opt/fleet/lib/verify-url.sh` passed both `/` and
  `/?demo=1` with complete title/lang/main/alt/button checks and no errors.
- **Keyboard:** first Tab focused the skip link with a 3 px coral outline;
  Enter moved focus to `main`; the cold `#install` route focused its heading.
- **Mobile:** at 390×844, scroll width was exactly 390 px; the primary action
  was fully in the first viewport at 350×50 px; no visible interactive target
  was under 44×44 px. The demo also had no horizontal overflow. At 200% text,
  width stayed 390 px and the h1 remained visible.
- **Motion:** reduced-motion matched; entrance and transition durations became
  0.001 ms with one iteration.
- **Links:** every rendered non-mail link across the main routes returned 200,
  including the public GitHub source and Param Factory link.

## Headers, caching, offline, and performance

- HTML includes self-only CSP with `frame-ancestors 'none'`, HSTS, `nosniff`,
  strict-origin referrer policy, and a restrictive permissions policy.
- HTML and service worker revalidate after 30 seconds. Hashed JavaScript has a
  one-year immutable policy; an `If-None-Match` request returned 304.
- After an explicit service-worker update and an online reload, `/demo` was
  controlled by the activated live `sw.js`; with browser network and HTTP
  cache disabled, it reloaded offline with the demo heading and banner.
- Initial JS: 13,854 B raw / 5,170 B gzip. CSS: 10,945 B raw / 3,242 B gzip.
  Fonts total 102,036 B raw. Hero image: 79,942 B. All meet supplied budgets.
- Fresh Lighthouse mobile: Performance 94, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.06 s, LCP 1.88 s, TBT 266 ms, CLS 0.

## Applicability

There is no product backend, sign-in, AI feature, analytics endpoint, or
product-unlock request. Endpoint concurrency, persistence, health/build ID,
Entra authority, and API allowance/429 checks are therefore not exercisable.
The absence of the required paid flow is V7-2, not a rate-limit failure.

## Release decision

The CLI, sandbox, static deployment, privacy boundary, accessibility, and
performance all work. The release still **FAILS** because V7-1 violates the
explicit claim-manifest release gate and V7-2 omits a researched product
requirement. Re-run all gates after those contract defects are resolved.
