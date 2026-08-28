# Independent verification — Worktree Secret Broker

**Verdict: FAIL — release blocking findings remain.**

- Candidate commit: `3abdc8ec80c170928e95587f4b34c0ec6d6fae46`
- Live URL: <https://worktree-secret-broker.sociobot.in>
- Verified: 2026-08-28, 13:37–13:43 UTC
- Verifier changed no product source. This report and the handoff are the only
  repository changes.

## Release blockers

### High — the advertised paid purchase link is dead in production

The landing page offers **“Buy team policy tools”** for `$19` and links to
`https://api.sociobot.in/api/v1/products/worktree-secret-broker/checkout`.
Fresh live checks returned **HTTP 404** for that URL. A crawl of every first-
party link found this as the only non-200 link. The verify endpoint itself is
live (`200 {"valid":false,"reason":"invalid","expires_at":null}` for a
probe token), so this is specifically a missing/unregistered checkout product,
not a general API outage.

This violates the paid-unlock contract and leaves a visible paid feature that a
visitor cannot buy. Register/configure the checkout product and retest its
redirect before release.

### High — claim inventory is incomplete

The required `.factory/claims.json` exists and all seven declared claims have a
passing tagged test. But the live landing page and README contain additional
visitor-reliant claims without an entry and one-to-one sandbox test, including:

- Landing page: “Values stay in your keychain.” (also inaccurate for the
  documented 1Password source option), “No secret files.”, and “The real CLI
  run uses the same sample shown here.”
- README: “local-only, has no telemetry”, “The CLI has no network code or
  telemetry”, and “The value does not appear in the command line.”

The claims acceptance contract explicitly says an unlisted claim fails review
until it is removed or receives a demo-entry-point observable test. Add precise
claims/tests or narrow/remove this copy.

## Required claims — all passed

Executed each exact command after `npm ci`, from this clean candidate checkout.
Each invocation also ran `cargo fmt --check`, Rust unit/doc tests, a site build,
and its selected Playwright test.

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-isolated` | `npm test -- --grep @claim:demo-isolated` | PASS — 1 test |
| `approved-environment` | `npm test -- --grep @claim:approved-environment` | PASS — 1 test |
| `names-only-receipt` | `npm test -- --grep @claim:names-only-receipt` | PASS — 1 test |
| `production-denied` | `npm test -- --grep @claim:production-denied` | PASS — 1 test |
| `lease-expiry` | `npm test -- --grep @claim:lease-expiry` | PASS — 1 test |
| `demo-same-origin` | `npm test -- --grep @claim:demo-same-origin` | PASS — 1 test |
| `paid-policy-tools` | `npm test -- --grep @claim:paid-policy-tools` | PASS — 1 test (mocked valid verification response) |

The first six CLI/browser claims therefore exercise the intended normal,
boundary, and recovery paths: isolated demo cleanup, cleared environment,
names-only output, default production denial, one-second expiry revocation, and
same-origin demo traffic. The paid claim cannot demonstrate the real checkout:
it mocks verification and only asserts the checkout href, which is why the
production 404 above was caught independently.

## Cold first-read test — PASS

A new browser context opened the live home page at desktop size. The first
screen says **“Lease secrets to one worktree process”**, identifies **developers
running coding agents**, and makes **“Try it with sample data”** the primary
action with the immediate explanation “Opens an isolated recorded CLI run.”
The action reached `/demo` in one activation. The demo shows the persistent
“Demo — sample data, nothing is saved” banner plus Reset demo and Start for
real controls. This meets the plain-words/demo entry requirement.

## Local build, package, and CLI evidence

- `npm ci`: PASS (22 packages installed).
- `npm test`: PASS — 4 Rust unit tests, 0 Rust doc tests, and all 13 Playwright
  tests. The suite includes `cargo fmt --check`.
- `npm run build`: PASS — static deployment in `dist/site/` and optimized
  binary in `dist/bin/wsb` (1,009 KB).
- `cargo package --allow-dirty`: PASS —
  `target/package/worktree-secret-broker-0.1.0.crate` (68 KB).
- Installed the unpacked crate into a fresh temporary consumer with
  `cargo install --root <temp> --path <unpacked-crate> --locked`: PASS.
  The installed `wsb --help`, `wsb init`, and `wsb demo --json` worked. The
  generated config’s expected missing-provider recovery path returned exit 1
  with: “secret-tool is not installed. Install the OS keychain CLI, then run
  check again”.

## Live deployment, browser, privacy, and performance evidence

- Candidate identity: local and live SHA-256 matched for `index.html`, the
  JavaScript bundle (`6cd757…f8806d`), and CSS bundle
  (`7367d7…e262b0b`). The live page is the candidate build, not an older
  deployment.
- Routes `/`, `/demo`, `/privacy`, `/terms`, and `/missing`: one `main`, one
  `h1`, route-specific titles, no browser console/page errors, and zero Axe
  serious/critical findings on each.
- 390×844 mobile: primary action visible (350×50 px) and no horizontal
  overflow. Keyboard starts at the skip link with a visible coral 3 px outline.
  Reduced-motion overrides observed as `1e-06s` animation/transition durations.
- Service worker became controlling after reload; `/demo` then reloaded
  successfully offline with its heading and demo banner present.
- Demo browser traffic was same-origin only (also independently asserted by the
  declared claim). Static source permits only the explicit Sociobot licensing
  origin; no analytics or third-party runtime asset was observed.
- Headers on the live site include CSP, HSTS, `nosniff`, strict-origin referrer
  policy, and permissions policy. Hashed JS is `max-age=31536000, immutable`.
- Budgets pass: JS gzip 5,771 B; CSS gzip 3,191 B; fonts 102,036 B; hero image
  79,942 B.
- Rate-limit test of the live license-verify endpoint: a 40-request parallel
  burst produced 30 × 200 and 10 × 429. A follow-up 429 included
  `Retry-After: 3` and `X-RateLimit-After: 3`. No sign-in flow exists.

## Lower-severity notes

- `npm audit` reports one high-severity transitive npm advisory after `npm ci`.
  It did not prevent the build/tests and requires dependency review before a
  future release.
- The documented native provider path is macOS/Linux only; Windows users need
  1Password CLI. This is disclosed in the existing handoff and is not a new
  regression against the brief.

## Retest requirements

1. Register or repair the Sociobot checkout product and show a real 2xx/3xx
   checkout response, not only a mocked Playwright route.
2. Reconcile every unlisted claim with `.factory/claims.json`, with one tagged
   test per claim through the shipped demo entry point, or remove/narrow it.
3. Rerun the seven claim commands, `npm test`, `npm run build`, package/clean
   consumer installation, and the live checkout/link check.
